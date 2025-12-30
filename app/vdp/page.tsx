"use client"

import { useState } from "react"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Shield, AlertTriangle, CheckCircle2, ChevronRight, Mail } from "lucide-react"
import { submitVdpAction } from "./actions"
import { toast } from "sonner"
import Link from "next/link"

export default function VdpPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const result = await submitVdpAction({
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            title: formData.get("title") as string,
            component: formData.get("component") as string,
            steps: formData.get("steps") as string,
            severity: formData.get("severity") as string,
        })

        setIsSubmitting(false)
        if (result.success) {
            setIsSubmitted(true)
            toast.success(result.message)
        } else {
            toast.error(result.message)
        }
    }

    if (isSubmitted) {
        return (
            <Container className="min-h-[80vh] flex items-center justify-center">
                <Card className="max-w-md w-full border-border/60 bg-card/70 text-center p-8">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold mb-2">Report Received</CardTitle>
                    <CardDescription className="text-lg">
                        Thank you for helping us keep 5teen secure. Our security team has been notified and will review your submission.
                    </CardDescription>
                    <div className="mt-8">
                        <Link href="/">
                            <Button variant="outline" className="rounded-2xl">Return to Homepage</Button>
                        </Link>
                    </div>
                </Card>
            </Container>
        )
    }

    return (
        <Container className="py-12 space-y-12">
            <div className="max-w-3xl mx-auto space-y-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Vulnerability Disclosure Policy</h1>
                <p className="text-muted-foreground text-lg">
                    At 5teen, we take security seriously. If you believe you've found a security vulnerability in our platform, we encourage you to let us know.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                {/* Policy Section */}
                <div className="space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            Our Commitment
                        </h2>
                        <p className="text-muted-foreground">
                            We will investigate all legitimate reports and do our best to quickly fix the problem. We will not take legal action against you as long as you comply with this policy.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-primary" />
                            Reporting Guidelines
                        </h2>
                        <ul className="space-y-3">
                            {[
                                "Do not attempt to access or modify data that does not belong to you.",
                                "Do not perform DoS or DDoS attacks.",
                                "Give us a reasonable amount of time to fix the issue before sharing it publicly.",
                                "Provide a clear description of the vulnerability and reproduction steps.",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                    <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <Card className="border-border/60 bg-primary/5">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Mail className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-semibold">Questions?</p>
                                <p className="text-sm text-muted-foreground">Contact our security team at security@5teen.app</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Form Section */}
                <Card className="border-border/60 bg-card/70">
                    <CardHeader>
                        <CardTitle>Submit a Report</CardTitle>
                        <CardDescription>Provide details about the vulnerability you've discovered.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name (Optional)</label>
                                    <Input name="name" placeholder="John Doe" className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input name="email" type="email" placeholder="john@example.com" required className="rounded-xl" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Vulnerability Title</label>
                                <Input name="title" placeholder="XSS in Dashboard Search" required className="rounded-xl" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Affected Component</label>
                                <Input name="component" placeholder="Dashboard / SBOM Portal" className="rounded-xl" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Severity Level</label>
                                <select
                                    name="severity"
                                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    defaultValue="Medium"
                                >
                                    <option value="Critical">Critical</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Reproduction Steps</label>
                                <Textarea
                                    name="steps"
                                    placeholder="1. Navigate to...\n2. Click on...\n3. Observed behavior..."
                                    required
                                    className="min-h-[150px] rounded-xl"
                                />
                            </div>

                            <Button type="submit" className="w-full bg-primary text-primary-foreground rounded-xl" disabled={isSubmitting}>
                                {isSubmitting ? "Submitting..." : "Submit Disclosure"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Container>
    )
}
