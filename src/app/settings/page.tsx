"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
    Check,
    Copy,
    ExternalLink,
    FileText,
    Github,
    MessageSquare,
    UserRound,
} from "lucide-react"

import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { appConfig } from "@/lib/app-config"

function buildIssuePrompt() {
    // Keep this mirrored with docs/issue-prompt-template.md.
    return [
        `Help me write a high-quality GitHub issue for this repository: ${appConfig.repository.url}.`,
        "",
        "Ask me focused questions until the issue is clear enough to publish. Use all context I can provide: screenshots, browser/device, route, user role, expected behavior, actual behavior, logs, recent changes, and whether this is production, staging, or local development.",
        "",
        "Then draft:",
        "- title",
        "- issue type",
        "- context",
        "- steps to reproduce",
        "- expected behavior",
        "- actual behavior",
        "- impact",
        "- possible fix or design direction",
        "- acceptance criteria",
        "",
        "Keep the final issue concise and concrete.",
    ].join("\n")
}

export default function SettingsPage() {
    const [copied, setCopied] = useState(false)
    const issuePrompt = useMemo(() => buildIssuePrompt(), [])

    const copyIssuePrompt = async () => {
        try {
            await navigator.clipboard.writeText(issuePrompt)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1800)
        } catch (error) {
            console.error("Failed to copy issue prompt", error)
        }
    }

    return (
        <ProtectedRoute>
            <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24 pt-20">
                <header className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-normal">Settings</h1>
                    <p className="text-sm text-muted-foreground">
                        {appConfig.branding.logoText}
                    </p>
                </header>

                <section className="grid gap-3 sm:grid-cols-2">
                    <Link
                        href="/complete-profile"
                        className="flex min-h-24 items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                    >
                        <UserRound className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                            <h2 className="text-sm font-medium">Profile</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Name and account details</p>
                        </div>
                    </Link>

                    <Link
                        href={appConfig.legal.termsPath}
                        className="flex min-h-24 items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                    >
                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                            <h2 className="text-sm font-medium">Terms</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{appConfig.legal.itemGiftLabel}</p>
                        </div>
                    </Link>
                </section>

                <section className="rounded-lg border bg-card">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-medium">Repository</h2>
                    </div>
                    <div className="grid gap-2 p-3 sm:grid-cols-2">
                        <Button asChild variant="secondary" className="justify-start">
                            <a href={appConfig.repository.url} target="_blank" rel="noreferrer">
                                <Github className="h-4 w-4" />
                                Source code
                                <ExternalLink className="ml-auto h-4 w-4" />
                            </a>
                        </Button>
                        <Button asChild variant="secondary" className="justify-start">
                            <a href={appConfig.repository.issuesUrl} target="_blank" rel="noreferrer">
                                <MessageSquare className="h-4 w-4" />
                                Issues
                                <ExternalLink className="ml-auto h-4 w-4" />
                            </a>
                        </Button>
                        {appConfig.repository.discussionsUrl && (
                            <Button asChild variant="secondary" className="justify-start sm:col-span-2">
                                <a href={appConfig.repository.discussionsUrl} target="_blank" rel="noreferrer">
                                    <MessageSquare className="h-4 w-4" />
                                    Discussions
                                    <ExternalLink className="ml-auto h-4 w-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </section>

                <section className="rounded-lg border bg-card">
                    <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                        <h2 className="text-sm font-medium">Issue prompt</h2>
                        <Button type="button" variant="secondary" size="sm" onClick={copyIssuePrompt}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </div>
                    <textarea
                        aria-label="Issue prompt"
                        readOnly
                        value={issuePrompt}
                        className="min-h-72 w-full resize-y border-0 bg-transparent p-4 font-mono text-xs leading-5 outline-none"
                    />
                </section>
            </main>
        </ProtectedRoute>
    )
}
