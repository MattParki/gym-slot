"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, FileText } from "lucide-react"
import { useState } from "react"

interface ProposalOutputProps {
  proposal: string
}

export default function ProposalOutput({ proposal }: ProposalOutputProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    // Create a blob with the proposal text
    const blob = new Blob([proposal], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    // Create a link element and trigger download
    const a = document.createElement("a")
    a.href = url
    a.download = "proposal.txt"
    document.body.appendChild(a)
    a.click()

    // Clean up
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Generated Proposal</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleCopy} title={copied ? "Copied!" : "Copy to clipboard"}>
            <Copy className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSave} title="Save as file">
            <FileText className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-line">{proposal}</div>
      </CardContent>
    </Card>
  )
}
