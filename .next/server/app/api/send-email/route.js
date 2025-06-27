/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/send-email/route";
exports.ids = ["app/api/send-email/route"];
exports.modules = {

/***/ "(rsc)/./app/api/send-email/route.ts":
/*!*************************************!*\
  !*** ./app/api/send-email/route.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var nodemailer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! nodemailer */ \"(rsc)/./node_modules/nodemailer/lib/nodemailer.js\");\n/* harmony import */ var _lib_firebase__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/firebase */ \"(rsc)/./lib/firebase.ts\");\n/* harmony import */ var _lib_firebase_admin__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/firebase-admin */ \"(rsc)/./lib/firebase-admin.ts\");\n/* harmony import */ var firebase_firestore__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! firebase/firestore */ \"(rsc)/./node_modules/firebase/firestore/dist/index.mjs\");\n/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! crypto */ \"crypto\");\n/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(crypto__WEBPACK_IMPORTED_MODULE_5__);\n\n\n\n\n\n\nasync function POST(req) {\n    try {\n        let { from, to, subject, text, html, userId, proposalId } = await req.json();\n        const internalEmailId = (0,crypto__WEBPACK_IMPORTED_MODULE_5__.randomUUID)(); // Generate a unique ID for the email\n        const senderEmail = from || \"no-reply@prospectseasy.com\";\n        const transporter = nodemailer__WEBPACK_IMPORTED_MODULE_1__.createTransport({\n            host: process.env.MAILTRAP_HOST,\n            port: parseInt(process.env.MAILTRAP_PORT || \"587\"),\n            auth: {\n                user: process.env.MAILTRAP_USER,\n                pass: process.env.MAILTRAP_PASS\n            }\n        });\n        const htmlContent = html || `\n  <div>${text.replace(/\\n/g, '<br>')}</div>\n`;\n        console.log(htmlContent);\n        const mailOptions = {\n            from: senderEmail,\n            to,\n            subject,\n            text,\n            html: htmlContent\n        };\n        const info = await transporter.sendMail(mailOptions);\n        console.log(\"Mailgun sendMail info:\", info);\n        // Store email data in Firestore\n        const sentEmailsRef = (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_4__.collection)(_lib_firebase__WEBPACK_IMPORTED_MODULE_2__.db, \"sentEmails\");\n        const docRef = await (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_4__.addDoc)(sentEmailsRef, {\n            mailId: info.messageId,\n            userId: userId || \"anonymous\",\n            to,\n            from: senderEmail,\n            subject,\n            sentAt: (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_4__.serverTimestamp)(),\n            initialStatus: \"sent\",\n            deliveryStatus: \"pending\",\n            openStatus: \"not_opened\",\n            openCount: 0,\n            openEvents: [],\n            mailgunId: null,\n            internalEmailId,\n            ...proposalId ? {\n                proposalId\n            } : {}\n        });\n        if (to && userId) {\n            try {\n                const clientsSnapshot = await _lib_firebase_admin__WEBPACK_IMPORTED_MODULE_3__.adminDb.collection(\"clients\").where(\"email\", \"==\", to).where(\"userId\", \"==\", userId).get();\n                if (!clientsSnapshot.empty) {\n                    const clientDoc = clientsSnapshot.docs[0];\n                    const clientId = clientDoc.id;\n                    const today = new Date().toISOString().split('T')[0];\n                    await _lib_firebase_admin__WEBPACK_IMPORTED_MODULE_3__.adminDb.collection(\"clients\").doc(clientId).update({\n                        lastContactDate: today\n                    });\n                }\n            } catch (error) {\n                console.error(\"Error updating client by email:\", error);\n            }\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            success: true,\n            messageId: info.messageId,\n            internalEmailId\n        });\n    } catch (error) {\n        console.error(\"Error sending email:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            success: false,\n            error: error.message\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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UUFDakMsR0FBRztZQUFFQyxRQUFRO1FBQUk7SUFDbkI7QUFDRiIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxtYXR0cFxcRGVza3RvcFxcZ3ltLXNsb3RcXGFwcFxcYXBpXFxzZW5kLWVtYWlsXFxyb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIjtcclxuaW1wb3J0IG5vZGVtYWlsZXIgZnJvbSBcIm5vZGVtYWlsZXJcIjtcclxuaW1wb3J0IHsgZGIgfSBmcm9tIFwiQC9saWIvZmlyZWJhc2VcIjtcclxuaW1wb3J0IHsgYWRtaW5EYiB9IGZyb20gXCJAL2xpYi9maXJlYmFzZS1hZG1pblwiO1xyXG5pbXBvcnQgeyBjb2xsZWN0aW9uLCBhZGREb2MsIHNlcnZlclRpbWVzdGFtcCB9IGZyb20gXCJmaXJlYmFzZS9maXJlc3RvcmVcIjtcclxuaW1wb3J0IHsgcmFuZG9tVVVJRCB9IGZyb20gXCJjcnlwdG9cIjtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBQT1NUKHJlcTogUmVxdWVzdCkge1xyXG4gIHRyeSB7XHJcbiAgICBsZXQgeyBmcm9tLCB0bywgc3ViamVjdCwgdGV4dCwgaHRtbCwgdXNlcklkLCBwcm9wb3NhbElkIH0gPSBhd2FpdCByZXEuanNvbigpO1xyXG5cclxuICAgIGNvbnN0IGludGVybmFsRW1haWxJZCA9IHJhbmRvbVVVSUQoKTsgLy8gR2VuZXJhdGUgYSB1bmlxdWUgSUQgZm9yIHRoZSBlbWFpbFxyXG5cclxuICAgIGNvbnN0IHNlbmRlckVtYWlsID0gZnJvbSB8fCBcIm5vLXJlcGx5QHByb3NwZWN0c2Vhc3kuY29tXCI7XHJcblxyXG4gICAgY29uc3QgdHJhbnNwb3J0ZXIgPSBub2RlbWFpbGVyLmNyZWF0ZVRyYW5zcG9ydCh7XHJcbiAgICAgIGhvc3Q6IHByb2Nlc3MuZW52Lk1BSUxUUkFQX0hPU1QsXHJcbiAgICAgIHBvcnQ6IHBhcnNlSW50KHByb2Nlc3MuZW52Lk1BSUxUUkFQX1BPUlQgfHwgXCI1ODdcIiksXHJcbiAgICAgIGF1dGg6IHtcclxuICAgICAgICB1c2VyOiBwcm9jZXNzLmVudi5NQUlMVFJBUF9VU0VSLFxyXG4gICAgICAgIHBhc3M6IHByb2Nlc3MuZW52Lk1BSUxUUkFQX1BBU1MsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgY29uc3QgaHRtbENvbnRlbnQgPSBodG1sIHx8IGBcclxuICA8ZGl2PiR7dGV4dC5yZXBsYWNlKC9cXG4vZywgJzxicj4nKX08L2Rpdj5cclxuYDtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhodG1sQ29udGVudCk7XHJcblxyXG4gICAgY29uc3QgbWFpbE9wdGlvbnMgPSB7XHJcbiAgICAgIGZyb206IHNlbmRlckVtYWlsLFxyXG4gICAgICB0byxcclxuICAgICAgc3ViamVjdCxcclxuICAgICAgdGV4dCxcclxuICAgICAgaHRtbDogaHRtbENvbnRlbnQsXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGluZm8gPSBhd2FpdCB0cmFuc3BvcnRlci5zZW5kTWFpbChtYWlsT3B0aW9ucyk7XHJcblxyXG4gICAgY29uc29sZS5sb2coXCJNYWlsZ3VuIHNlbmRNYWlsIGluZm86XCIsIGluZm8pO1xyXG5cclxuICAgIC8vIFN0b3JlIGVtYWlsIGRhdGEgaW4gRmlyZXN0b3JlXHJcbiAgICBjb25zdCBzZW50RW1haWxzUmVmID0gY29sbGVjdGlvbihkYiwgXCJzZW50RW1haWxzXCIpO1xyXG4gICAgY29uc3QgZG9jUmVmID0gYXdhaXQgYWRkRG9jKHNlbnRFbWFpbHNSZWYsIHtcclxuICAgICAgbWFpbElkOiBpbmZvLm1lc3NhZ2VJZCxcclxuICAgICAgdXNlcklkOiB1c2VySWQgfHwgXCJhbm9ueW1vdXNcIixcclxuICAgICAgdG8sXHJcbiAgICAgIGZyb206IHNlbmRlckVtYWlsLFxyXG4gICAgICBzdWJqZWN0LFxyXG4gICAgICBzZW50QXQ6IHNlcnZlclRpbWVzdGFtcCgpLFxyXG4gICAgICBpbml0aWFsU3RhdHVzOiBcInNlbnRcIixcclxuICAgICAgZGVsaXZlcnlTdGF0dXM6IFwicGVuZGluZ1wiLFxyXG4gICAgICBvcGVuU3RhdHVzOiBcIm5vdF9vcGVuZWRcIixcclxuICAgICAgb3BlbkNvdW50OiAwLFxyXG4gICAgICBvcGVuRXZlbnRzOiBbXSxcclxuICAgICAgbWFpbGd1bklkOiBudWxsLFxyXG4gICAgICBpbnRlcm5hbEVtYWlsSWQsXHJcbiAgICAgIC4uLihwcm9wb3NhbElkID8geyBwcm9wb3NhbElkIH0gOiB7fSksXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAodG8gJiYgdXNlcklkKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgY2xpZW50c1NuYXBzaG90ID0gYXdhaXQgYWRtaW5EYlxyXG4gICAgICAgICAgLmNvbGxlY3Rpb24oXCJjbGllbnRzXCIpXHJcbiAgICAgICAgICAud2hlcmUoXCJlbWFpbFwiLCBcIj09XCIsIHRvKVxyXG4gICAgICAgICAgLndoZXJlKFwidXNlcklkXCIsIFwiPT1cIiwgdXNlcklkKVxyXG4gICAgICAgICAgLmdldCgpO1xyXG5cclxuICAgICAgICBpZiAoIWNsaWVudHNTbmFwc2hvdC5lbXB0eSkge1xyXG4gICAgICAgICAgY29uc3QgY2xpZW50RG9jID0gY2xpZW50c1NuYXBzaG90LmRvY3NbMF07XHJcbiAgICAgICAgICBjb25zdCBjbGllbnRJZCA9IGNsaWVudERvYy5pZDtcclxuXHJcbiAgICAgICAgICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdO1xyXG4gICAgICAgICAgYXdhaXQgYWRtaW5EYlxyXG4gICAgICAgICAgICAuY29sbGVjdGlvbihcImNsaWVudHNcIilcclxuICAgICAgICAgICAgLmRvYyhjbGllbnRJZClcclxuICAgICAgICAgICAgLnVwZGF0ZSh7XHJcbiAgICAgICAgICAgICAgbGFzdENvbnRhY3REYXRlOiB0b2RheVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHVwZGF0aW5nIGNsaWVudCBieSBlbWFpbDpcIiwgZXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHtcclxuICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgbWVzc2FnZUlkOiBpbmZvLm1lc3NhZ2VJZCxcclxuICAgICAgaW50ZXJuYWxFbWFpbElkXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIHNlbmRpbmcgZW1haWw6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBlcnJvcjogKGVycm9yIGFzIEVycm9yKS5tZXNzYWdlXHJcbiAgICB9LCB7IHN0YXR1czogNTAwIH0pO1xyXG4gIH1cclxufSJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJub2RlbWFpbGVyIiwiZGIiLCJhZG1pbkRiIiwiY29sbGVjdGlvbiIsImFkZERvYyIsInNlcnZlclRpbWVzdGFtcCIsInJhbmRvbVVVSUQiLCJQT1NUIiwicmVxIiwiZnJvbSIsInRvIiwic3ViamVjdCIsInRleHQiLCJodG1sIiwidXNlcklkIiwicHJvcG9zYWxJZCIsImpzb24iLCJpbnRlcm5hbEVtYWlsSWQiLCJzZW5kZXJFbWFpbCIsInRyYW5zcG9ydGVyIiwiY3JlYXRlVHJhbnNwb3J0IiwiaG9zdCIsInByb2Nlc3MiLCJlbnYiLCJNQUlMVFJBUF9IT1NUIiwicG9ydCIsInBhcnNlSW50IiwiTUFJTFRSQVBfUE9SVCIsImF1dGgiLCJ1c2VyIiwiTUFJTFRSQVBfVVNFUiIsInBhc3MiLCJNQUlMVFJBUF9QQVNTIiwiaHRtbENvbnRlbnQiLCJyZXBsYWNlIiwiY29uc29sZSIsImxvZyIsIm1haWxPcHRpb25zIiwiaW5mbyIsInNlbmRNYWlsIiwic2VudEVtYWlsc1JlZiIsImRvY1JlZiIsIm1haWxJZCIsIm1lc3NhZ2VJZCIsInNlbnRBdCIsImluaXRpYWxTdGF0dXMiLCJkZWxpdmVyeVN0YXR1cyIsIm9wZW5TdGF0dXMiLCJvcGVuQ291bnQiLCJvcGVuRXZlbnRzIiwibWFpbGd1bklkIiwiY2xpZW50c1NuYXBzaG90Iiwid2hlcmUiLCJnZXQiLCJlbXB0eSIsImNsaWVudERvYyIsImRvY3MiLCJjbGllbnRJZCIsImlkIiwidG9kYXkiLCJEYXRlIiwidG9JU09TdHJpbmciLCJzcGxpdCIsImRvYyIsInVwZGF0ZSIsImxhc3RDb250YWN0RGF0ZSIsImVycm9yIiwic3VjY2VzcyIsIm1lc3NhZ2UiLCJzdGF0dXMiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/send-email/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/firebase-admin.ts":
/*!*******************************!*\
  !*** ./lib/firebase-admin.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   adminDb: () => (/* binding */ adminDb)\n/* harmony export */ });\n/* harmony import */ var firebase_admin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! firebase-admin */ \"firebase-admin\");\n/* harmony import */ var firebase_admin__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(firebase_admin__WEBPACK_IMPORTED_MODULE_0__);\n// lib/firebase-admin.ts\n\nif (!firebase_admin__WEBPACK_IMPORTED_MODULE_0__.apps.length) {\n    firebase_admin__WEBPACK_IMPORTED_MODULE_0__.initializeApp({\n        credential: firebase_admin__WEBPACK_IMPORTED_MODULE_0__.credential.cert({\n            projectId: process.env.FIREBASE_PROJECT_ID,\n            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,\n            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n')\n        })\n    });\n}\nconst adminDb = firebase_admin__WEBPACK_IMPORTED_MODULE_0__.firestore();\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvZmlyZWJhc2UtYWRtaW4udHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsd0JBQXdCO0FBQ2dCO0FBRXhDLElBQUksQ0FBQ0EsZ0RBQVUsQ0FBQ0UsTUFBTSxFQUFFO0lBQ3RCRix5REFBbUIsQ0FBQztRQUNsQkksWUFBWUosc0RBQWdCLENBQUNLLElBQUksQ0FBQztZQUNoQ0MsV0FBV0MsUUFBUUMsR0FBRyxDQUFDQyxtQkFBbUI7WUFDMUNDLGFBQWFILFFBQVFDLEdBQUcsQ0FBQ0cscUJBQXFCO1lBQzlDQyxZQUFZTCxRQUFRQyxHQUFHLENBQUNLLG9CQUFvQixFQUFFQyxRQUFRLFFBQVE7UUFDaEU7SUFDRjtBQUNGO0FBRUEsTUFBTUMsVUFBVWYscURBQWU7QUFFWiIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxtYXR0cFxcRGVza3RvcFxcZ3ltLXNsb3RcXGxpYlxcZmlyZWJhc2UtYWRtaW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gbGliL2ZpcmViYXNlLWFkbWluLnRzXHJcbmltcG9ydCAqIGFzIGFkbWluIGZyb20gJ2ZpcmViYXNlLWFkbWluJztcclxuXHJcbmlmICghYWRtaW4uYXBwcy5sZW5ndGgpIHtcclxuICBhZG1pbi5pbml0aWFsaXplQXBwKHtcclxuICAgIGNyZWRlbnRpYWw6IGFkbWluLmNyZWRlbnRpYWwuY2VydCh7XHJcbiAgICAgIHByb2plY3RJZDogcHJvY2Vzcy5lbnYuRklSRUJBU0VfUFJPSkVDVF9JRCxcclxuICAgICAgY2xpZW50RW1haWw6IHByb2Nlc3MuZW52LkZJUkVCQVNFX0NMSUVOVF9FTUFJTCxcclxuICAgICAgcHJpdmF0ZUtleTogcHJvY2Vzcy5lbnYuRklSRUJBU0VfUFJJVkFURV9LRVk/LnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKSxcclxuICAgIH0pLFxyXG4gIH0pO1xyXG59XHJcblxyXG5jb25zdCBhZG1pbkRiID0gYWRtaW4uZmlyZXN0b3JlKCk7XHJcblxyXG5leHBvcnQgeyBhZG1pbkRiIH07XHJcbiJdLCJuYW1lcyI6WyJhZG1pbiIsImFwcHMiLCJsZW5ndGgiLCJpbml0aWFsaXplQXBwIiwiY3JlZGVudGlhbCIsImNlcnQiLCJwcm9qZWN0SWQiLCJwcm9jZXNzIiwiZW52IiwiRklSRUJBU0VfUFJPSkVDVF9JRCIsImNsaWVudEVtYWlsIiwiRklSRUJBU0VfQ0xJRU5UX0VNQUlMIiwicHJpdmF0ZUtleSIsIkZJUkVCQVNFX1BSSVZBVEVfS0VZIiwicmVwbGFjZSIsImFkbWluRGIiLCJmaXJlc3RvcmUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/firebase-admin.ts\n");

/***/ }),

/***/ "(rsc)/./lib/firebase.ts":
/*!*************************!*\
  !*** ./lib/firebase.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   app: () => (/* binding */ app),\n/* harmony export */   auth: () => (/* binding */ auth),\n/* harmony export */   db: () => (/* binding */ db)\n/* harmony export */ });\n/* harmony import */ var firebase_app__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! firebase/app */ \"(rsc)/./node_modules/firebase/app/dist/index.mjs\");\n/* harmony import */ var firebase_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! firebase/auth */ \"(rsc)/./node_modules/firebase/auth/dist/index.mjs\");\n/* harmony import */ var firebase_firestore__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! firebase/firestore */ \"(rsc)/./node_modules/firebase/firestore/dist/index.mjs\");\n\n\n\nconst firebaseConfig = {\n    apiKey: \"AIzaSyDgIhVXCw_BLH7QGCzc8XlO-jragWqI8W0\",\n    authDomain: \"proposalai-87cae.firebaseapp.com\",\n    projectId: \"gymslot-e4e34\",\n    storageBucket: \"proposalai-87cae.firebasestorage.app\",\n    messagingSenderId: \"205542612658\",\n    appId: \"205542612658\"\n};\n// Initialize Firebase\nconst app = (0,firebase_app__WEBPACK_IMPORTED_MODULE_0__.getApps)().length > 0 ? (0,firebase_app__WEBPACK_IMPORTED_MODULE_0__.getApp)() : (0,firebase_app__WEBPACK_IMPORTED_MODULE_0__.initializeApp)(firebaseConfig);\nconst auth = (0,firebase_auth__WEBPACK_IMPORTED_MODULE_1__.getAuth)(app);\nconst db = (0,firebase_firestore__WEBPACK_IMPORTED_MODULE_2__.getFirestore)(app);\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvZmlyZWJhc2UudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQThEO0FBQ3RCO0FBQ1U7QUFFbEQsTUFBTUssaUJBQWlCO0lBQ3JCQyxRQUFRQyx5Q0FBd0M7SUFDaERHLFlBQVlILGtDQUE0QztJQUN4REssV0FBV0wsZUFBMkM7SUFDdERPLGVBQWVQLHNDQUErQztJQUM5RFMsbUJBQW1CVCxjQUFvRDtJQUN2RVcsT0FBT1gsY0FBdUM7QUFDaEQ7QUFFQSxzQkFBc0I7QUFDdEIsTUFBTWEsTUFBTW5CLHFEQUFPQSxHQUFHb0IsTUFBTSxHQUFHLElBQUluQixvREFBTUEsS0FBS0YsMkRBQWFBLENBQUNLO0FBQzVELE1BQU1pQixPQUFPbkIsc0RBQU9BLENBQUNpQjtBQUNyQixNQUFNRyxLQUFLbkIsZ0VBQVlBLENBQUNnQjtBQUVDIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXG1hdHRwXFxEZXNrdG9wXFxneW0tc2xvdFxcbGliXFxmaXJlYmFzZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBpbml0aWFsaXplQXBwLCBnZXRBcHBzLCBnZXRBcHAgfSBmcm9tICdmaXJlYmFzZS9hcHAnO1xyXG5pbXBvcnQgeyBnZXRBdXRoIH0gZnJvbSAnZmlyZWJhc2UvYXV0aCc7XHJcbmltcG9ydCB7IGdldEZpcmVzdG9yZSB9IGZyb20gJ2ZpcmViYXNlL2ZpcmVzdG9yZSc7XHJcblxyXG5jb25zdCBmaXJlYmFzZUNvbmZpZyA9IHtcclxuICBhcGlLZXk6IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX0ZJUkVCQVNFX0FQSV9LRVksXHJcbiAgYXV0aERvbWFpbjogcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfRklSRUJBU0VfQVVUSF9ET01BSU4sXHJcbiAgcHJvamVjdElkOiBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19GSVJFQkFTRV9QUk9KRUNUX0lELFxyXG4gIHN0b3JhZ2VCdWNrZXQ6IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX0ZJUkVCQVNFX1NUT1JBR0VfQlVDS0VULFxyXG4gIG1lc3NhZ2luZ1NlbmRlcklkOiBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19GSVJFQkFTRV9NRVNTQUdJTkdfU0VOREVSX0lELFxyXG4gIGFwcElkOiBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19GSVJFQkFTRV9BUFBfSUQsXHJcbn07XHJcblxyXG4vLyBJbml0aWFsaXplIEZpcmViYXNlXHJcbmNvbnN0IGFwcCA9IGdldEFwcHMoKS5sZW5ndGggPiAwID8gZ2V0QXBwKCkgOiBpbml0aWFsaXplQXBwKGZpcmViYXNlQ29uZmlnKTtcclxuY29uc3QgYXV0aCA9IGdldEF1dGgoYXBwKTtcclxuY29uc3QgZGIgPSBnZXRGaXJlc3RvcmUoYXBwKTtcclxuXHJcbmV4cG9ydCB7IGFwcCwgYXV0aCwgZGIgfTsiXSwibmFtZXMiOlsiaW5pdGlhbGl6ZUFwcCIsImdldEFwcHMiLCJnZXRBcHAiLCJnZXRBdXRoIiwiZ2V0RmlyZXN0b3JlIiwiZmlyZWJhc2VDb25maWciLCJhcGlLZXkiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9QVUJMSUNfRklSRUJBU0VfQVBJX0tFWSIsImF1dGhEb21haW4iLCJORVhUX1BVQkxJQ19GSVJFQkFTRV9BVVRIX0RPTUFJTiIsInByb2plY3RJZCIsIk5FWFRfUFVCTElDX0ZJUkVCQVNFX1BST0pFQ1RfSUQiLCJzdG9yYWdlQnVja2V0IiwiTkVYVF9QVUJMSUNfRklSRUJBU0VfU1RPUkFHRV9CVUNLRVQiLCJtZXNzYWdpbmdTZW5kZXJJZCIsIk5FWFRfUFVCTElDX0ZJUkVCQVNFX01FU1NBR0lOR19TRU5ERVJfSUQiLCJhcHBJZCIsIk5FWFRfUFVCTElDX0ZJUkVCQVNFX0FQUF9JRCIsImFwcCIsImxlbmd0aCIsImF1dGgiLCJkYiJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/firebase.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsend-email%2Froute&page=%2Fapi%2Fsend-email%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsend-email%2Froute.ts&appDir=C%3A%5CUsers%5Cmattp%5CDesktop%5Cgym-slot%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cmattp%5CDesktop%5Cgym-slot&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsend-email%2Froute&page=%2Fapi%2Fsend-email%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsend-email%2Froute.ts&appDir=C%3A%5CUsers%5Cmattp%5CDesktop%5Cgym-slot%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cmattp%5CDesktop%5Cgym-slot&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_mattp_Desktop_gym_slot_app_api_send_email_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/send-email/route.ts */ \"(rsc)/./app/api/send-email/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/send-email/route\",\n        pathname: \"/api/send-email\",\n        filename: \"route\",\n        bundlePath: \"app/api/send-email/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\mattp\\\\Desktop\\\\gym-slot\\\\app\\\\api\\\\send-email\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_mattp_Desktop_gym_slot_app_api_send_email_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZzZW5kLWVtYWlsJTJGcm91dGUmcGFnZT0lMkZhcGklMkZzZW5kLWVtYWlsJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGc2VuZC1lbWFpbCUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNtYXR0cCU1Q0Rlc2t0b3AlNUNneW0tc2xvdCU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9QyUzQSU1Q1VzZXJzJTVDbWF0dHAlNUNEZXNrdG9wJTVDZ3ltLXNsb3QmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQ21CO0FBQ2hHO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJDOlxcXFxVc2Vyc1xcXFxtYXR0cFxcXFxEZXNrdG9wXFxcXGd5bS1zbG90XFxcXGFwcFxcXFxhcGlcXFxcc2VuZC1lbWFpbFxcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvc2VuZC1lbWFpbC9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3NlbmQtZW1haWxcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL3NlbmQtZW1haWwvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxtYXR0cFxcXFxEZXNrdG9wXFxcXGd5bS1zbG90XFxcXGFwcFxcXFxhcGlcXFxcc2VuZC1lbWFpbFxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsend-email%2Froute&page=%2Fapi%2Fsend-email%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsend-email%2Froute.ts&appDir=C%3A%5CUsers%5Cmattp%5CDesktop%5Cgym-slot%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cmattp%5CDesktop%5Cgym-slot&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "dns":
/*!**********************!*\
  !*** external "dns" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("dns");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "firebase-admin":
/*!*********************************!*\
  !*** external "firebase-admin" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("firebase-admin");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "http2":
/*!************************!*\
  !*** external "http2" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("http2");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "process":
/*!**************************!*\
  !*** external "process" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("process");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@firebase","vendor-chunks/@grpc","vendor-chunks/protobufjs","vendor-chunks/long","vendor-chunks/@opentelemetry","vendor-chunks/@protobufjs","vendor-chunks/lodash.camelcase","vendor-chunks/tslib","vendor-chunks/idb","vendor-chunks/firebase","vendor-chunks/nodemailer"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fsend-email%2Froute&page=%2Fapi%2Fsend-email%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fsend-email%2Froute.ts&appDir=C%3A%5CUsers%5Cmattp%5CDesktop%5Cgym-slot%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cmattp%5CDesktop%5Cgym-slot&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();