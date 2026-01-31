"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Paragraph, XStack, YStack } from "tamagui"
import { Phone, MessageSquare, CheckCircle, Star, Coins, X, AlertCircle } from "@tamagui/lucide-icons"
import {
  DashboardContent,
  JobCard,
  JobServiceName,
  JobLocation,
  JobDetails,
  JobMeta,
  JobBadge,
  JobBadgeText,
  JobTime,
  EmptyState,
  EmptyStateText,
  NavTabs,
  NavTab,
  NavTabText,
  CustomerAvatar,
  CustomerInitials,
  TrustBadge,
  TrustBadgeText,
  ResponseIndicator,
  ResponseDot,
  ResponseText,
  CompetitionIndicator,
  CompetitionDots,
  CompetitionDot,
  CompetitionText,
  CreditCost,
  CreditText,
} from "components/styled/provider-dashboard"
import {
  calculateCreditCost,
  formatCreditsWithDollars,
} from "lib/provider/constants"
import {
  formatTimeAgo,
  formatTimeNeed,
  getColorIndex,
  getFirstName,
  getInitials,
} from "lib/provider/utils"

type JobStatus = "sent" | "contacted" | "won" | "completed" | "lost" | "expired"

interface Review {
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  createdAt: string
}

interface Job {
  id: string
  requestId: string
  serviceName: string
  serviceSlug: string
  suburb: string
  postcode?: string
  details: string
  timeNeed: "now" | "today" | "this-week"
  status: JobStatus
  customerPhone: string
  customerName: string
  verifiedPhone?: boolean
  frequentUser?: boolean
  dispatchedAt: string
  batchNumber: number
  respondedCount?: number
  maxResponders?: number
  creditCost?: number
  wonAt?: string
  completedAt?: string
  review?: Review
}

type FilterTab = "leads" | "jobs" | "history"

const STATUS_BY_TAB: Record<FilterTab, JobStatus[]> = {
  leads: ["sent", "contacted"],
  jobs: ["won"],
  history: ["completed", "lost", "expired"],
}

const DEMO_JOBS: Job[] = [
  // Leads - new job requests
  {
    id: "demo-1",
    requestId: "req-demo-1",
    serviceName: "Plumber",
    serviceSlug: "plumber",
    suburb: "Ponsonby, Auckland",
    postcode: "1021",
    details: "Leaking tap in the kitchen. Water is dripping constantly and needs urgent repair.",
    timeNeed: "now",
    status: "sent",
    customerPhone: "+64 21 123 4567",
    customerName: "Sarah Mitchell",
    verifiedPhone: true,
    frequentUser: true,
    dispatchedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    batchNumber: 1,
    respondedCount: 0,
    maxResponders: 3,
  },
  {
    id: "demo-2",
    requestId: "req-demo-2",
    serviceName: "Plumber",
    serviceSlug: "plumber",
    suburb: "Grey Lynn, Auckland",
    postcode: "1021",
    details: "Need hot water cylinder checked. Not heating properly, might need replacement.",
    timeNeed: "today",
    status: "sent",
    customerPhone: "+64 22 987 6543",
    customerName: "James Wilson",
    verifiedPhone: true,
    dispatchedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    batchNumber: 1,
    respondedCount: 2,
    maxResponders: 3,
  },
  // Jobs - won/in-progress
  {
    id: "demo-3",
    requestId: "req-demo-3",
    serviceName: "Plumber",
    serviceSlug: "plumber",
    suburb: "Mt Eden, Auckland",
    postcode: "1024",
    details: "Blocked drain in bathroom. Water not draining properly.",
    timeNeed: "today",
    status: "won",
    customerPhone: "+64 21 555 1234",
    customerName: "Emma Thompson",
    verifiedPhone: true,
    frequentUser: true,
    dispatchedAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    batchNumber: 1,
    wonAt: new Date(Date.now() - 1 * 60 * 60000).toISOString(),
  },
  // History - completed with review
  {
    id: "demo-4",
    requestId: "req-demo-4",
    serviceName: "Plumber",
    serviceSlug: "plumber",
    suburb: "Newmarket, Auckland",
    postcode: "1023",
    details: "Install new dishwasher connections.",
    timeNeed: "this-week",
    status: "completed",
    customerPhone: "+64 22 888 9999",
    customerName: "Michael Chen",
    verifiedPhone: true,
    dispatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString(),
    batchNumber: 1,
    wonAt: new Date(Date.now() - 4 * 24 * 60 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
    review: {
      rating: 5,
      comment: "Excellent work! Very professional and finished quickly.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
    },
  },
  // History - completed without review
  {
    id: "demo-5",
    requestId: "req-demo-5",
    serviceName: "Plumber",
    serviceSlug: "plumber",
    suburb: "Parnell, Auckland",
    postcode: "1052",
    details: "Fix toilet flush mechanism.",
    timeNeed: "today",
    status: "completed",
    customerPhone: "+64 21 777 3333",
    customerName: "Lisa Wong",
    verifiedPhone: true,
    dispatchedAt: new Date(Date.now() - 10 * 24 * 60 * 60000).toISOString(),
    batchNumber: 1,
    wonAt: new Date(Date.now() - 9 * 24 * 60 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 8 * 24 * 60 * 60000).toISOString(),
  },
]

interface ContactConfirmationProps {
  job: Job
  onConfirmCall: () => void
  onConfirmText: () => void
  onCancel: () => void
  onBuyCredits: () => void
  providerCredits: number
  loading?: boolean
}

function ContactConfirmationModal({ job, onConfirmCall, onConfirmText, onCancel, onBuyCredits, providerCredits, loading }: ContactConfirmationProps) {
  const creditCost = job.creditCost ?? calculateCreditCost(job.serviceSlug, job.timeNeed)
  const hasEnoughCredits = providerCredits >= creditCost
  const firstName = getFirstName(job.customerName)

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="rgba(0,0,0,0.5)"
      alignItems="center"
      justifyContent="center"
      padding="$4"
      zIndex={1000}
      onPress={onCancel}
    >
      <YStack
        backgroundColor="$background"
        borderRadius="$4"
        padding="$5"
        width="100%"
        maxWidth={400}
        gap="$4"
        onPress={(e) => e.stopPropagation()}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <Paragraph fontSize="$6" fontWeight="700">
            Contact {firstName}?
          </Paragraph>
          <YStack
            padding="$2"
            borderRadius="$2"
            cursor="pointer"
            hoverStyle={{ backgroundColor: "$gray4" }}
            onPress={onCancel}
          >
            <X size={20} color="$colorSecondary" />
          </YStack>
        </XStack>

        <YStack gap="$3">
          <XStack
            backgroundColor="$gray3"
            padding="$4"
            borderRadius="$3"
            alignItems="center"
            justifyContent="space-between"
          >
            <Paragraph fontSize="$4" color="$colorSecondary">Cost</Paragraph>
            <XStack alignItems="center" gap="$2">
              <Coins size={18} color="$accent6" />
              <Paragraph fontSize="$5" fontWeight="600">
                {formatCreditsWithDollars(creditCost)}
              </Paragraph>
            </XStack>
          </XStack>

          <XStack
            backgroundColor="$gray3"
            padding="$4"
            borderRadius="$3"
            alignItems="center"
            justifyContent="space-between"
          >
            <Paragraph fontSize="$4" color="$colorSecondary">Your balance</Paragraph>
            <Paragraph fontSize="$5" fontWeight="600" color={hasEnoughCredits ? "$color" : "$red9"}>
              {providerCredits} Credits
            </Paragraph>
          </XStack>

          {!hasEnoughCredits && (
            <XStack
              backgroundColor="$red3"
              padding="$3"
              borderRadius="$3"
              alignItems="center"
              gap="$2"
            >
              <AlertCircle size={16} color="$red9" />
              <Paragraph fontSize="$3" color="$red9">
                Insufficient credits. You need {creditCost - providerCredits} more.
              </Paragraph>
            </XStack>
          )}
        </YStack>

        <YStack gap="$3" marginTop="$2">
          {hasEnoughCredits ? (
            <XStack gap="$3">
              <XStack
                flex={1}
                backgroundColor="$accent6"
                padding="$4"
                borderRadius="$3"
                alignItems="center"
                justifyContent="center"
                gap="$2"
                cursor={loading ? "not-allowed" : "pointer"}
                opacity={loading ? 0.6 : 1}
                hoverStyle={loading ? {} : { opacity: 0.9 }}
                pressStyle={loading ? {} : { opacity: 0.8 }}
                onPress={loading ? undefined : onConfirmCall}
              >
                <Phone size={20} color="white" />
                <Paragraph fontSize="$5" fontWeight="600" color="white">
                  Call
                </Paragraph>
              </XStack>
              <XStack
                flex={1}
                backgroundColor="$primary7"
                padding="$4"
                borderRadius="$3"
                alignItems="center"
                justifyContent="center"
                gap="$2"
                cursor={loading ? "not-allowed" : "pointer"}
                opacity={loading ? 0.6 : 1}
                hoverStyle={loading ? {} : { opacity: 0.9 }}
                pressStyle={loading ? {} : { opacity: 0.8 }}
                onPress={loading ? undefined : onConfirmText}
              >
                <MessageSquare size={20} color="white" />
                <Paragraph fontSize="$5" fontWeight="600" color="white">
                  Text
                </Paragraph>
              </XStack>
            </XStack>
          ) : (
            <XStack
              backgroundColor="$accent6"
              padding="$4"
              borderRadius="$3"
              alignItems="center"
              justifyContent="center"
              gap="$2"
              cursor="pointer"
              hoverStyle={{ opacity: 0.9 }}
              pressStyle={{ opacity: 0.8 }}
              onPress={onBuyCredits}
            >
              <Coins size={20} color="white" />
              <Paragraph fontSize="$5" fontWeight="600" color="white">
                Buy Credits
              </Paragraph>
            </XStack>
          )}

          <XStack
            backgroundColor="$gray4"
            padding="$3"
            borderRadius="$3"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            hoverStyle={{ backgroundColor: "$gray5" }}
            onPress={onCancel}
          >
            <Paragraph fontSize="$4" fontWeight="500" color="$colorSecondary">
              Cancel
            </Paragraph>
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  )
}

interface JobCardComponentProps {
  job: Job
  expanded: boolean
  onToggle: () => void
  onContact: () => void
  onMarkComplete: () => void
  onMarkWon: () => void
  onMarkLost: () => void
  filter: FilterTab
}

function JobCardComponent({ job, expanded, onToggle, onContact, onMarkComplete, onMarkWon, onMarkLost, filter }: JobCardComponentProps) {
  const isLead = filter === "leads"
  const isJob = filter === "jobs"
  const isHistory = filter === "history"

  return (
    <JobCard onPress={onToggle}>
      <XStack gap="$3" alignItems="flex-start">
        <CustomerAvatar colorIndex={getColorIndex(job.customerName)}>
          <CustomerInitials>{getInitials(job.customerName)}</CustomerInitials>
        </CustomerAvatar>

        <YStack flex={1} gap="$2">
          <XStack justifyContent="space-between" alignItems="flex-start">
            <YStack flex={1} gap={0}>
              <JobServiceName>
                {isLead ? getFirstName(job.customerName) : job.customerName}
              </JobServiceName>
              <JobLocation>{job.suburb}{job.postcode ? ` ${job.postcode}` : ""}</JobLocation>
            </YStack>
            {isLead && (
              <JobBadge urgency={job.timeNeed}>
                <JobBadgeText urgency={job.timeNeed}>{formatTimeNeed(job.timeNeed)}</JobBadgeText>
              </JobBadge>
            )}
            {isHistory && job.status === "completed" && (
              <Paragraph fontSize="$2" color="$green9" fontWeight="500">
                Completed
              </Paragraph>
            )}
            {isHistory && job.status === "lost" && (
              <Paragraph fontSize="$2" color="$colorSecondary" fontWeight="500">
                Didn't win
              </Paragraph>
            )}
            {isHistory && job.status === "expired" && (
              <Paragraph fontSize="$2" color="$colorSecondary" fontWeight="500">
                Expired
              </Paragraph>
            )}
          </XStack>

          {isLead && (
            <XStack gap="$2" flexWrap="wrap">
              {job.status === "contacted" && (
                <XStack
                  alignItems="center"
                  gap="$1"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius={999}
                  backgroundColor="$accent3"
                >
                  <Phone size={12} color="$accent9" strokeWidth={2.5} />
                  <Paragraph fontSize="$2" color="$accent9">Contacted</Paragraph>
                </XStack>
              )}
              {job.verifiedPhone && (
                <TrustBadge>
                  <CheckCircle size={12} color="$green9" strokeWidth={2.5} />
                  <TrustBadgeText>Verified phone</TrustBadgeText>
                </TrustBadge>
              )}
              {job.frequentUser && (
                <TrustBadge>
                  <Star size={12} color="$orange9" strokeWidth={2.5} />
                  <TrustBadgeText>Frequent user</TrustBadgeText>
                </TrustBadge>
              )}
            </XStack>
          )}

          <JobDetails>{job.details}</JobDetails>
        </YStack>
      </XStack>

      <YStack height={1} backgroundColor="$borderColor" marginTop="$1" marginBottom="$1" />

      <XStack justifyContent="space-between" alignItems="center">
        <JobMeta>
          <JobTime>
            {isHistory && job.completedAt
              ? formatTimeAgo(job.completedAt)
              : isJob && job.wonAt
                ? `Won ${formatTimeAgo(job.wonAt)}`
                : formatTimeAgo(job.dispatchedAt)}
          </JobTime>
          {isLead && job.maxResponders !== undefined && (
            <CompetitionIndicator>
              <CompetitionDots>
                {Array.from({ length: job.maxResponders }).map((_, i) => (
                  <CompetitionDot key={i} filled={i < (job.respondedCount || 0)} />
                ))}
              </CompetitionDots>
              <CompetitionText>{job.respondedCount || 0}/{job.maxResponders}</CompetitionText>
            </CompetitionIndicator>
          )}
          {isLead && job.respondedCount === 0 && (
            <ResponseIndicator>
              <ResponseDot />
              <ResponseText>1st to respond</ResponseText>
            </ResponseIndicator>
          )}
        </JobMeta>
        {isLead && (
          <CreditCost>
            <Coins size={14} color="$accent6" />
            <CreditText>
              {formatCreditsWithDollars(
                job.creditCost ?? calculateCreditCost(job.serviceSlug, job.timeNeed)
              )}
            </CreditText>
          </CreditCost>
        )}
        {(isJob || isHistory) && (
          <XStack alignItems="center" gap="$2">
            <Phone size={14} color="$accent6" />
            <Paragraph fontSize="$3" fontWeight="500" color="$accent6">
              {job.customerPhone}
            </Paragraph>
          </XStack>
        )}
      </XStack>

      {expanded && isLead && job.status === "sent" && (
        <YStack
          marginTop="$3"
          paddingTop="$3"
          borderTopWidth={1}
          borderTopColor="$borderColor"
          gap="$3"
        >
          <XStack
            alignItems="center"
            justifyContent="center"
            gap="$2"
            padding="$4"
            backgroundColor="$accent6"
            borderRadius="$3"
            cursor="pointer"
            hoverStyle={{ opacity: 0.9 }}
            pressStyle={{ opacity: 0.8 }}
            onPress={(e) => {
              e.stopPropagation()
              onContact()
            }}
          >
            <Phone size={20} color="white" />
            <Paragraph fontSize="$5" fontWeight="600" color="white">
              Contact {getFirstName(job.customerName)}
            </Paragraph>
          </XStack>
          <Paragraph fontSize="$2" color="$colorSecondary" textAlign="center">
            {formatCreditsWithDollars(job.creditCost ?? calculateCreditCost(job.serviceSlug, job.timeNeed))} will be deducted from your balance
          </Paragraph>
        </YStack>
      )}

      {expanded && isLead && job.status === "contacted" && (
        <YStack
          marginTop="$3"
          paddingTop="$3"
          borderTopWidth={1}
          borderTopColor="$borderColor"
          gap="$3"
        >
          <XStack
            backgroundColor="$gray3"
            padding="$3"
            borderRadius="$3"
            alignItems="center"
            gap="$2"
          >
            <Phone size={16} color="$accent6" />
            <Paragraph fontSize="$4" fontWeight="500" color="$accent6">
              {job.customerPhone}
            </Paragraph>
          </XStack>
          <Paragraph fontSize="$3" color="$colorSecondary" textAlign="center">
            Did you win this job?
          </Paragraph>
          <XStack gap="$3">
            <XStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              gap="$2"
              padding="$4"
              backgroundColor="$green9"
              borderRadius="$3"
              cursor="pointer"
              hoverStyle={{ opacity: 0.9 }}
              pressStyle={{ opacity: 0.8 }}
              onPress={(e) => {
                e.stopPropagation()
                onMarkWon()
              }}
            >
              <CheckCircle size={20} color="white" />
              <Paragraph fontSize="$5" fontWeight="600" color="white">
                Won
              </Paragraph>
            </XStack>
            <XStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              gap="$2"
              padding="$4"
              backgroundColor="$gray6"
              borderRadius="$3"
              cursor="pointer"
              hoverStyle={{ opacity: 0.9 }}
              pressStyle={{ opacity: 0.8 }}
              onPress={(e) => {
                e.stopPropagation()
                onMarkLost()
              }}
            >
              <X size={20} color="white" />
              <Paragraph fontSize="$5" fontWeight="600" color="white">
                Didn't win
              </Paragraph>
            </XStack>
          </XStack>
        </YStack>
      )}

      {expanded && isJob && (
        <YStack
          marginTop="$3"
          paddingTop="$3"
          borderTopWidth={1}
          borderTopColor="$borderColor"
          gap="$3"
        >
          <XStack gap="$3">
            <XStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              gap="$2"
              padding="$4"
              backgroundColor="$accent6"
              borderRadius="$3"
              cursor="pointer"
              hoverStyle={{ opacity: 0.9 }}
              pressStyle={{ opacity: 0.8 }}
              onPress={(e) => {
                e.stopPropagation()
                window.location.href = `tel:${job.customerPhone.replace(/\s/g, "")}`
              }}
            >
              <Phone size={20} color="white" />
              <Paragraph fontSize="$5" fontWeight="600" color="white">
                Call
              </Paragraph>
            </XStack>
            <XStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              gap="$2"
              padding="$4"
              backgroundColor="$primary7"
              borderRadius="$3"
              cursor="pointer"
              hoverStyle={{ opacity: 0.9 }}
              pressStyle={{ opacity: 0.8 }}
              onPress={(e) => {
                e.stopPropagation()
                onMarkComplete()
              }}
            >
              <CheckCircle size={20} color="white" />
              <Paragraph fontSize="$5" fontWeight="600" color="white">
                Complete
              </Paragraph>
            </XStack>
          </XStack>
        </YStack>
      )}

      {expanded && isHistory && job.status === "completed" && (
        <YStack
          marginTop="$3"
          paddingTop="$3"
          borderTopWidth={1}
          borderTopColor="$borderColor"
          gap="$3"
        >
          {job.review ? (
            <YStack
              backgroundColor="$gray2"
              borderRadius="$3"
              padding="$4"
              gap="$3"
            >
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2">
                  <YStack
                    width={36}
                    height={36}
                    borderRadius={18}
                    backgroundColor="$gray5"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Paragraph fontSize="$4" fontWeight="600">
                      {getInitials(job.customerName)}
                    </Paragraph>
                  </YStack>
                  <YStack>
                    <Paragraph fontSize="$3" fontWeight="600">
                      {getFirstName(job.customerName)}
                    </Paragraph>
                    <Paragraph fontSize="$2" color="$colorSecondary">
                      {formatTimeAgo(job.review.createdAt)}
                    </Paragraph>
                  </YStack>
                </XStack>
                <XStack
                  backgroundColor="$gray4"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                  alignItems="center"
                  gap="$1"
                >
                  <Star size={14} color="$orange9" fill="currentColor" strokeWidth={0} />
                  <Paragraph fontSize="$3" fontWeight="700">
                    {job.review.rating}.0
                  </Paragraph>
                </XStack>
              </XStack>
              {job.review.comment && (
                <Paragraph fontSize="$3" color="$color" lineHeight={22}>
                  {job.review.comment}
                </Paragraph>
              )}
            </YStack>
          ) : (
            <YStack
              backgroundColor="$gray2"
              borderRadius="$3"
              padding="$4"
              alignItems="center"
              gap="$2"
            >
              <Star size={24} color="$gray6" strokeWidth={1.5} />
              <Paragraph fontSize="$3" color="$colorSecondary">
                No review yet
              </Paragraph>
            </YStack>
          )}
        </YStack>
      )}
    </JobCard>
  )
}

export default function ProviderDashboardPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>("leads")
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [confirmingJob, setConfirmingJob] = useState<Job | null>(null)
  const [contactLoading, setContactLoading] = useState(false)
  const [providerCredits, setProviderCredits] = useState<number>(0)

  useEffect(() => {
    // Fetch jobs - redirect to login if not authenticated
    fetch("/api/provider/jobs")
      .then((res) => {
        if (res.status === 401) {
          router.push("/provider/login")
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (!data) return
        setJobs(Array.isArray(data.jobs) ? data.jobs : [])
      })
      .catch(() => {
        setJobs([])
      })
      .finally(() => setLoading(false))

    // Fetch provider credits
    fetch("/api/provider/me")
      .then((res) => {
        if (res.status === 401) {
          router.push("/provider/login")
          return null
        }
        return res.ok ? res.json() : null
      })
      .then((data) => {
        if (data && typeof data.credits === "number") {
          setProviderCredits(data.credits)
        }
      })
      .catch(() => {
        // Keep default of 0
      })
  }, [])

  const handleContactConfirm = async (actionType: "call" | "text") => {
    if (!confirmingJob) return

    setContactLoading(true)

    try {
      const response = await fetch("/api/provider/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispatchId: confirmingJob.id,
          actionType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          // Insufficient credits - redirect to buy credits
          alert(`Insufficient credits. You need ${data.required} credits but only have ${data.available}.`)
          return
        }
        throw new Error(data.error || "Failed to record contact")
      }

      // Update local state
      setJobs((prev) =>
        prev.map((job) =>
          job.id === confirmingJob.id
            ? { ...job, status: "contacted" as JobStatus, customerPhone: data.customerPhone }
            : job
        )
      )

      // Update credits balance
      if (typeof data.newBalance === "number") {
        setProviderCredits(data.newBalance)
      }

      // Close modal
      setConfirmingJob(null)

      // Trigger the actual contact action
      const phoneNumber = data.customerPhone.replace(/\s/g, "")
      if (actionType === "call") {
        window.location.href = `tel:${phoneNumber}`
      } else {
        window.location.href = `sms:${phoneNumber}`
      }
    } catch (error) {
      console.error("Contact error:", error)
      alert(error instanceof Error ? error.message : "Failed to contact customer")
    } finally {
      setContactLoading(false)
    }
  }

  const handleMarkWon = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? { ...job, status: "won" as JobStatus, wonAt: new Date().toISOString() }
          : job
      )
    )
    setExpandedJob(null)
    // TODO: Call API to persist the status change
  }

  const handleMarkLost = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? { ...job, status: "lost" as JobStatus }
          : job
      )
    )
    setExpandedJob(null)
    // TODO: Call API to persist the status change
  }

  const handleMarkComplete = (jobId: string) => {
    // Update local state to mark job as completed
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? { ...job, status: "completed" as JobStatus, completedAt: new Date().toISOString() }
          : job
      )
    )
    setExpandedJob(null)
    // TODO: Call API to persist the status change
  }

  const filteredJobs = jobs.filter((job) => STATUS_BY_TAB[filter].includes(job.status))

  if (loading) {
    return (
      <DashboardContent>
        <EmptyState>
          <Paragraph>Loading...</Paragraph>
        </EmptyState>
      </DashboardContent>
    )
  }

  const emptyMessages: Record<FilterTab, string> = {
    leads: "No new leads. We'll notify you when customers need your services.",
    jobs: "No active jobs. Win a lead to see it here.",
    history: "No completed jobs yet.",
  }

  return (
    <YStack flex={1} position="relative">
      <DashboardContent>
        <NavTabs>
          <NavTab active={filter === "leads"} onPress={() => setFilter("leads")}>
            <NavTabText active={filter === "leads"}>Leads</NavTabText>
          </NavTab>
          <NavTab active={filter === "jobs"} onPress={() => setFilter("jobs")}>
            <NavTabText active={filter === "jobs"}>Jobs</NavTabText>
          </NavTab>
          <NavTab active={filter === "history"} onPress={() => setFilter("history")}>
            <NavTabText active={filter === "history"}>History</NavTabText>
          </NavTab>
        </NavTabs>

        {filteredJobs.length === 0 ? (
          <EmptyState>
            <EmptyStateText>{emptyMessages[filter]}</EmptyStateText>
          </EmptyState>
        ) : (
          <YStack gap="$3">
            {filteredJobs.map((job) => (
              <JobCardComponent
                key={job.id}
                job={job}
                expanded={expandedJob === job.id}
                onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                onContact={() => setConfirmingJob(job)}
                onMarkComplete={() => handleMarkComplete(job.id)}
                onMarkWon={() => handleMarkWon(job.id)}
                onMarkLost={() => handleMarkLost(job.id)}
                filter={filter}
              />
            ))}
          </YStack>
        )}
      </DashboardContent>

      {confirmingJob && (
        <ContactConfirmationModal
          job={confirmingJob}
          providerCredits={providerCredits}
          onConfirmCall={() => handleContactConfirm("call")}
          onConfirmText={() => handleContactConfirm("text")}
          onCancel={() => setConfirmingJob(null)}
          onBuyCredits={() => {
            setConfirmingJob(null)
            router.push("/provider/credits")
          }}
          loading={contactLoading}
        />
      )}
    </YStack>
  )
}
