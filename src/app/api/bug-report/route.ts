import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const mockRequest = new Request('http://localhost', {
      headers: {
        cookie: cookieStore.toString(),
      },
    })
    
    const session = await getCurrentUser(mockRequest)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      bugTitle,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      priority,
      userAgent,
      screenResolution,
    } = body

    // Validate required fields
    if (!bugTitle || !description) {
      return NextResponse.json(
        { error: 'Bug title and description are required' },
        { status: 400 }
      )
    }

    // Get GitHub configuration from environment
    const githubToken = process.env.GITHUB_TOKEN
    const githubRepo = process.env.GITHUB_REPO // Format: "owner/repo"
    
    // Build the issue body
    const issueBody = `
## Bug Report

### Description
${description}

### Steps to Reproduce
${stepsToReproduce || 'Not provided'}

### Expected Behavior
${expectedBehavior || 'Not provided'}

### Actual Behavior
${actualBehavior || 'Not provided'}

### Priority
${priority || 'medium'}

---
**Reported by:** ${session.email}
**User Agent:** ${userAgent || 'Not provided'}
**Screen Resolution:** ${screenResolution || 'Not provided'}
**Date:** ${new Date().toISOString()}
    `.trim()

    let githubIssueNumber: number | null = null

    // If GitHub integration is configured, create an issue
    if (githubToken && githubRepo) {
      try {
        const [owner, repo] = githubRepo.split('/')
        
        const githubResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/issues`,
          {
            method: 'POST',
            headers: {
              'Authorization': `token ${githubToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
              title: `[${priority?.toUpperCase() || 'MEDIUM'}] ${bugTitle}`,
              body: issueBody,
              labels: ['bug', priority || 'medium'],
            }),
          }
        )

        if (!githubResponse.ok) {
          const errorData = await githubResponse.json()
          console.error('GitHub API error:', errorData)
          // Continue without failing - we still log locally
        } else {
          const githubData = await githubResponse.json()
          githubIssueNumber = githubData.number
          console.log('GitHub Issue created:', githubData.html_url)
        }
      } catch (githubError) {
        console.error('GitHub integration error:', githubError)
        // Continue without failing
      }
    }

    // Log the bug report
    const bugReport = {
      id: `BUG-${Date.now()}`,
      githubIssueNumber,
      userId: (session as any).id,
      userEmail: session.email,
      bugTitle,
      description,
      stepsToReproduce: stepsToReproduce || '',
      expectedBehavior: expectedBehavior || '',
      actualBehavior: actualBehavior || '',
      priority: priority || 'medium',
      userAgent: userAgent || '',
      screenResolution: screenResolution || '',
      status: 'new',
      createdAt: new Date().toISOString(),
    }

    console.log('Bug Report Submitted:', bugReport)

    // Build response
    const response: { success: boolean; message: string; bugId: string; githubUrl?: string } = {
      success: true,
      message: 'Bug report submitted successfully',
      bugId: bugReport.id,
    }

    // Add GitHub issue URL if created
    if (githubIssueNumber && githubRepo) {
      const [owner, repo] = githubRepo.split('/')
      response.message = 'Bug report submitted successfully! A GitHub issue has been created.'
      response.githubUrl = `https://github.com/${owner}/${repo}/issues/${githubIssueNumber}`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Bug report error:', error)
    return NextResponse.json(
      { error: 'Failed to submit bug report' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Bug Report API - Use POST to submit bug reports',
      githubIntegration: !!process.env.GITHUB_TOKEN,
      configuredRepo: process.env.GITHUB_REPO || 'Not configured'
    },
    { status: 200 }
  )
}
