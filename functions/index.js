const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(functions.config().stripe.secret_key);

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Daily cron job to update user proposals based on their Stripe subscription
 * 
 * This function:
 * 1. Runs daily at midnight
 * 2. Queries all business documents
 * 3. For each business, checks if the subscription is active
 * 4. If subscription is active and payment successful, tops up proposal credits
 */
exports.checkAndUpdateProposals = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    try {
      // console.log('Starting daily proposal credit refresh');
      const businessesSnapshot = await db.collection('businesses').get();
      const updatePromises = [];
      const errors = [];

      for (const businessDoc of businessesSnapshot.docs) {
        const businessData = businessDoc.data();
        const businessId = businessDoc.id;

        // Enhanced validation
        if (
          !businessData.subscriptionInfo ||
          !businessData.subscriptionInfo.subscriptionId ||
          businessData.subscriptionInfo.status !== 'active'
        ) {
          // console.log(`Skipping business ${businessId} due to missing/inactive subscription info`);
          continue;
        }

        try {
          // console.log(`Processing business ${businessId} with subscription ${businessData.subscriptionInfo.subscriptionId}`);

          const subscription = await stripe.subscriptions.retrieve(businessData.subscriptionInfo.subscriptionId);

          // console.log(`Stripe subscription status for ${businessId}: ${subscription.status}`);
    

          if (subscription.status === 'active') {
            const productId = subscription.items.data[0].price.product;
            const product = await stripe.products.retrieve(productId);
            // console.log(`Product for ${businessId}: ${product.name} (${productId})`);

            if (product.metadata && product.metadata.proposals) {
              const proposalsAllowed = parseInt(product.metadata.proposals, 10);

              // Use billing_cycle_anchor for the billing period start
              const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
              const billingPeriodStart = subscription.billing_cycle_anchor; // Use billing_cycle_anchor
              const lastRefreshTimestamp = (() => {
                try {
                  if (businessData.lastProposalRefreshDate?.toDate) {
                    const ts = businessData.lastProposalRefreshDate.toDate();
                    if (isNaN(ts.getTime())) {
                      throw new Error("Invalid Firestore timestamp");
                    }
                    return Math.floor(ts.getTime() / 1000);
                  }
                } catch (err) {
                  // console.warn(`Invalid lastProposalRefreshDate for ${businessId}:`, err.message);
                }
                return 0; // Default to 0 if the timestamp is invalid or missing
              })();

              if (!billingPeriodStart || isNaN(billingPeriodStart)) {
                // console.error(`Invalid billingPeriodStart for ${businessId}:`, billingPeriodStart);
                continue; // Skip this business if billingPeriodStart is invalid
              }

              // console.log(`${businessId} - Current time: ${new Date(currentTimestamp * 1000).toISOString()}`);
              // console.log(`${businessId} - Billing period start: ${new Date(billingPeriodStart * 1000).toISOString()}`);
              // console.log(`${businessId} - Last refresh: ${lastRefreshTimestamp ? new Date(lastRefreshTimestamp * 1000).toISOString() : 'never'}`);

              // Only refresh if it's the first run in this billing period or never refreshed before
              if (lastRefreshTimestamp < billingPeriodStart || !businessData.lastProposalRefreshDate) {
                // console.log(`Updating ${businessId} proposals to ${proposalsAllowed} (refresh needed)`);

                updatePromises.push(
                  businessDoc.ref.update({
                    proposalsRemaining: proposalsAllowed,
                    lastProposalRefreshDate: new Date(),
                  })
                );
              } else {
                // console.log(`Skipping ${businessId} proposals update - already refreshed in this billing period`);
              }
            } else {
              // console.log(`Product ${productId} for business ${businessId} has no proposals metadata`);
            }
          } else {
            // console.log(`Skipping business ${businessId} due to inactive subscription status: ${subscription.status}`);

            // Optionally update Firestore to match Stripe's status
            if (businessData.subscriptionInfo.status === 'active') {
              // console.log(`Updating business ${businessId} status from 'active' to '${subscription.status}'`);
              updatePromises.push(
                businessDoc.ref.update({
                  'subscriptionInfo.status': subscription.status
                })
              );
            }
          }
        } catch (error) {
          const errorMsg = `Error processing ${businessId}: ${error.message}`;
          // console.error(errorMsg);
          errors.push({
            businessId,
            error: error.message,
            stack: error.stack
          });

          // If Stripe can't find the subscription, update the status in Firestore
          if (error.code === 'resource_missing') {
            // console.log(`Subscription not found in Stripe for ${businessId}, marking as inactive`);
            updatePromises.push(
              businessDoc.ref.update({
                'subscriptionInfo.status': 'inactive'
              })
            );
          }
        }
      }

      if (updatePromises.length) {
        await Promise.all(updatePromises);
        // console.log(`Updated ${updatePromises.length} businesses`);
      } else {
        // console.log('No businesses needed updating');
      }

      if (errors.length) {
        // console.error(`Encountered ${errors.length} errors during execution`);
        // Consider sending an admin notification here
      }

      return null;
    } catch (err) {
      // console.error('Error in daily check:', err);
      return null;
    }
  });


exports.checkEmailActivityAndNotify = functions.pubsub
  .schedule('0 1 * * *') // Runs daily at 1 AM UTC
  .timeZone('UTC')
  .onRun(async () => {
    const db = admin.firestore();
    const now = new Date();
    const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

    const sentEmailsSnapshot = await db.collection('sentEmails')
      .where('sentAt', '>=', daysAgo(7))
      .get();


    const notifications = [];

    for (const doc of sentEmailsSnapshot.docs) {
      const email = doc.data();
      const sentDate = email.sentAt.toDate();
      const openDate = email.firstOpenedAt?.toDate?.() || null;
      const daysSinceSent = Math.floor((now - sentDate) / (1000 * 60 * 60 * 24));
      const daysSinceOpened = openDate ? Math.floor((now - openDate) / (1000 * 60 * 60 * 24)) : null;

      const userId = email.userId;
      const openCount = email.openCount;

      const proposalRef = db.collection("proposals").doc(email.proposalId);
      const proposalDoc = await proposalRef.get();
      if (!proposalDoc.exists) {
        continue;
      }


      const clientId = proposalDoc.data().clientId;
      if (!clientId) {
        continue;
      }

      const clientDoc = await db.collection("clients").doc(clientId).get();
      if (!clientDoc.exists) {
        continue;
      }

      const client = clientDoc.data();
      const clientName = client.name;
      const clientStatus = client.status;

      let message = null;

      // console.log(clientName, clientStatus, openCount, daysSinceSent, daysSinceOpened);

      // Logic branching
      if (clientStatus === 'lead' && openCount === 0 && daysSinceSent >= 3) {
        message = `Your proposal to ${clientName} hasn’t been opened yet. It could be a busy inbox or the wrong address. Want to send a light reminder or check the email?`;
      } else if (clientStatus === 'lead' && openCount > 0 && daysSinceOpened >= 2) {
        message = `${clientName} opened your proposal 2 days ago. Have they responded? Would you like to follow up while you’re still top-of-mind?`;
      } else if (clientStatus === 'prospect' && openCount > 1 && daysSinceOpened === 0) {
        message = `${clientName} has opened your proposal multiple times. That’s a strong signal of interest. A quick call or tailored follow-up could seal the deal.`;
      } else if (clientStatus === 'prospect' && openCount > 1 && daysSinceOpened >= 7) {
        message = `Interesting, ${clientName} just re-opened your proposal after a break. This could be a good moment to re-engage.`;
      }

      if (message) {
        notifications.push(
          db.collection('notifications').add({
            createdAt: now,
            message,
            read: false,
            userId,
            clientId,
          })
        );
      }
    }

    await Promise.all(notifications);
    console.log(`Created ${notifications.length} notifications`);
    return null;
  });


const app = express();
app.use(bodyParser.raw({ type: 'application/json' }));

app.post('/', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      functions.config().stripe.webhook_secret
    );
  } catch (error) {
    // console.error('Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      default:
      // console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).send({ received: true });
  } catch (err) {
    // console.error('Webhook handler error:', err);
    res.status(500).send({ error: 'Webhook handler failed' });
  }
});

exports.stripeWebhook = functions.https.onRequest(app);


async function handleInvoicePaid(invoice) {
  const { customer, subscription } = invoice;
  if (!subscription) return;

  const businesses = await db.collection('businesses')
    .where('subscriptionInfo.customerId', '==', customer)
    .where('subscriptionInfo.subscriptionId', '==', subscription)
    .get();

  if (businesses.empty) {
    // console.log(`No business found for customer ${customer}`);
    return;
  }

  const subscriptionData = await stripe.subscriptions.retrieve(subscription);
  const productId = subscriptionData.items.data[0].price.product;
  const product = await stripe.products.retrieve(productId);

  // console.log('FieldValue:', new Date());

  if (product.metadata?.proposals) {
    const proposalsAllowed = parseInt(product.metadata.proposals, 10);
    for (const doc of businesses.docs) {
      await doc.ref.update({
        proposalsRemaining: proposalsAllowed,
        lastProposalRefreshDate: new Date(),
      });
      // console.log(`Updated ${doc.id} proposals to ${proposalsAllowed}`);
    }
  }
}

async function handleSubscriptionCreated(subscription) {
  const { customer, id: subscriptionId } = subscription;
  const productId = subscription.items.data[0].price.product;
  const product = await stripe.products.retrieve(productId);

  const businesses = await db.collection('businesses')
    .where('subscriptionInfo.customerId', '==', customer)
    .get();

  if (businesses.empty) {
    // console.log(`No business found for customer ${customer}`);
    return;
  }

  if (product.metadata?.proposals) {
    const proposalsAllowed = parseInt(product.metadata.proposals, 10);
    for (const doc of businesses.docs) {
      await doc.ref.update({
        'subscriptionInfo.subscriptionId': subscriptionId,
        'subscriptionInfo.productId': productId,
        proposalsRemaining: proposalsAllowed,
        plan: product.name,
        lastProposalRefreshDate: new Date()
      });
      // console.log(`Set initial proposals for ${doc.id} to ${proposalsAllowed}`);
    }
  }
}

/**
 * Handle subscription.updated event
 * Update proposal credits when subscription plan changes
 */
async function handleSubscriptionUpdated(subscription) {
  const { id: subscriptionId, status } = subscription;
  if (status !== 'active') return;

  const productId = subscription.items.data[0].price.product;
  const product = await stripe.products.retrieve(productId);

  const businesses = await db.collection('businesses')
    .where('subscriptionInfo.subscriptionId', '==', subscriptionId)
    .get();

  if (businesses.empty) {
    // console.log(`No business found for subscription ${subscriptionId}`);
    return;
  }

  if (product.metadata?.proposals) {
    const proposalsAllowed = parseInt(product.metadata.proposals, 10);
    for (const doc of businesses.docs) {
      await doc.ref.update({
        'subscriptionInfo.productId': productId,
        proposalsRemaining: proposalsAllowed,
        plan: product.name,
        lastProposalRefreshDate: new Date()
      });
      // console.log(`Updated ${doc.id} proposals to ${proposalsAllowed}`);
    }
  }
}
