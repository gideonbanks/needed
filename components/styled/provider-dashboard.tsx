"use client"

import { H1, H2, Paragraph, styled, XStack, YStack } from "tamagui"

export const DashboardContainer = styled(YStack, {
  name: "DashboardContainer",
  minHeight: "100dvh",
  backgroundColor: "$background",
})

export const DashboardTitle = styled(H1, {
  name: "DashboardTitle",
  fontSize: "$7",
  fontWeight: "700",
})

export const DashboardContent = styled(YStack, {
  name: "DashboardContent",
  flex: 1,
  padding: "$4",
  gap: "$4",
  maxWidth: 800,
  width: "100%",
  alignSelf: "center",
})

export const SectionTitle = styled(H2, {
  name: "SectionTitle",
  fontSize: "$6",
  fontWeight: "600",
  marginBottom: "$2",
})

export const JobCard = styled(YStack, {
  name: "JobCard",
  padding: "$4",
  backgroundColor: "$backgroundStrong",
  borderRadius: "$3",
  borderWidth: 1,
  borderColor: "$borderColor",
  gap: "$2",
  cursor: "pointer",
  hoverStyle: {
    borderColor: "$accent6",
  },
  pressStyle: {
    opacity: 0.9,
  },
})

export const JobServiceName = styled(Paragraph, {
  name: "JobServiceName",
  fontSize: "$5",
  fontWeight: "600",
})

export const JobLocation = styled(Paragraph, {
  name: "JobLocation",
  fontSize: "$4",
  color: "$colorSecondary",
})

export const JobDetails = styled(Paragraph, {
  name: "JobDetails",
  fontSize: "$3",
  color: "$color",
  numberOfLines: 2,
})

export const JobMeta = styled(XStack, {
  name: "JobMeta",
  gap: "$3",
  alignItems: "center",
  marginTop: "$2",
})

export const JobBadge = styled(XStack, {
  name: "JobBadge",
  paddingHorizontal: "$3",
  paddingVertical: "$1",
  borderRadius: 999,
  borderWidth: 1,
  variants: {
    urgency: {
      now: {
        backgroundColor: "$red3",
        borderColor: "$red8",
      },
      today: {
        backgroundColor: "$orange3",
        borderColor: "$orange8",
      },
      "this-week": {
        backgroundColor: "$accent3",
        borderColor: "$accent8",
      },
    },
  } as const,
})

export const JobBadgeText = styled(Paragraph, {
  name: "JobBadgeText",
  fontSize: "$2",
  fontWeight: "600",
  variants: {
    urgency: {
      now: {
        color: "$red9",
      },
      today: {
        color: "$orange9",
      },
      "this-week": {
        color: "$accent9",
      },
    },
  } as const,
})

export const JobTime = styled(Paragraph, {
  name: "JobTime",
  fontSize: "$2",
  color: "$colorSecondary",
})

export const EmptyState = styled(YStack, {
  name: "EmptyState",
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  padding: "$8",
  gap: "$4",
})

export const EmptyStateText = styled(Paragraph, {
  name: "EmptyStateText",
  fontSize: "$5",
  color: "$colorSecondary",
  textAlign: "center",
})

export const NavTabs = styled(XStack, {
  name: "NavTabs",
  gap: "$2",
  marginBottom: "$4",
})

export const NavTab = styled(YStack, {
  name: "NavTab",
  paddingVertical: "$2",
  paddingHorizontal: "$4",
  borderRadius: "$2",
  cursor: "pointer",
  variants: {
    active: {
      true: {
        backgroundColor: "$accent6",
      },
      false: {
        backgroundColor: "$backgroundStrong",
        borderWidth: 1,
        borderColor: "$borderColor",
      },
    },
  } as const,
  defaultVariants: {
    active: false,
  },
})

export const NavTabText = styled(Paragraph, {
  name: "NavTabText",
  fontSize: "$3",
  fontWeight: "500",
  variants: {
    active: {
      true: {
        color: "white",
      },
      false: {
        color: "$color",
      },
    },
  } as const,
  defaultVariants: {
    active: false,
  },
})

// Toggle Switch Components
export const ToggleSwitchTrack = styled(XStack, {
  name: "ToggleSwitchTrack",
  width: 52,
  height: 28,
  borderRadius: 14,
  padding: 2,
  cursor: "pointer",
  transition: "background-color 0.2s ease",
  variants: {
    active: {
      true: {
        backgroundColor: "$green9",
      },
      false: {
        backgroundColor: "$gray6",
      },
    },
  } as const,
  defaultVariants: {
    active: false,
  },
})

export const ToggleSwitchKnob = styled(YStack, {
  name: "ToggleSwitchKnob",
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: "white",
  shadowColor: "rgba(0,0,0,0.2)",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 4,
  elevation: 2,
  transition: "transform 0.2s ease",
  variants: {
    active: {
      true: {
        transform: [{ translateX: 24 }],
      },
      false: {
        transform: [{ translateX: 0 }],
      },
    },
  } as const,
  defaultVariants: {
    active: false,
  },
})

// Legacy availability components (for header)
export const AvailabilityToggle = styled(XStack, {
  name: "AvailabilityToggle",
  alignItems: "center",
  gap: "$2",
  paddingHorizontal: "$3",
  paddingVertical: "$2",
  borderRadius: "$2",
  cursor: "pointer",
  variants: {
    available: {
      true: {
        backgroundColor: "$green3",
      },
      false: {
        backgroundColor: "$gray3",
      },
    },
  } as const,
})

export const AvailabilityDot = styled(YStack, {
  name: "AvailabilityDot",
  width: 8,
  height: 8,
  borderRadius: 4,
  variants: {
    available: {
      true: {
        backgroundColor: "$green9",
      },
      false: {
        backgroundColor: "$gray9",
      },
    },
  } as const,
})

export const AvailabilityText = styled(Paragraph, {
  name: "AvailabilityText",
  fontSize: "$3",
  fontWeight: "500",
})

// Customer Avatar for job cards
export const CustomerAvatar = styled(YStack, {
  name: "CustomerAvatar",
  width: 48,
  height: 48,
  borderRadius: 24,
  alignItems: "center",
  justifyContent: "center",
  variants: {
    colorIndex: {
      0: { backgroundColor: "$blue9" },
      1: { backgroundColor: "$purple9" },
      2: { backgroundColor: "$orange9" },
      3: { backgroundColor: "$green9" },
      4: { backgroundColor: "$pink9" },
      5: { backgroundColor: "$cyan9" },
    },
  } as const,
  defaultVariants: {
    colorIndex: 0,
  },
})

export const CustomerInitials = styled(Paragraph, {
  name: "CustomerInitials",
  fontSize: "$5",
  fontWeight: "600",
  color: "white",
})

// Trust badges for job cards
export const TrustBadge = styled(XStack, {
  name: "TrustBadge",
  alignItems: "center",
  gap: "$1",
  paddingHorizontal: "$2",
  paddingVertical: "$1",
  borderRadius: 999,
  backgroundColor: "$gray3",
})

export const TrustBadgeText = styled(Paragraph, {
  name: "TrustBadgeText",
  fontSize: "$2",
  color: "$colorSecondary",
})

// Response indicator
export const ResponseIndicator = styled(XStack, {
  name: "ResponseIndicator",
  alignItems: "center",
  gap: "$1",
})

export const ResponseDot = styled(YStack, {
  name: "ResponseDot",
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: "$green9",
})

export const ResponseText = styled(Paragraph, {
  name: "ResponseText",
  fontSize: "$2",
  color: "$green9",
  fontWeight: "500",
})

// Competition indicator (responses)
export const CompetitionIndicator = styled(XStack, {
  name: "CompetitionIndicator",
  alignItems: "center",
  gap: "$1.5",
})

export const CompetitionDots = styled(XStack, {
  name: "CompetitionDots",
  gap: 3,
  alignItems: "center",
})

export const CompetitionDot = styled(YStack, {
  name: "CompetitionDot",
  width: 6,
  height: 14,
  borderRadius: 2,
  variants: {
    filled: {
      true: { backgroundColor: "$green9" },
      false: { backgroundColor: "$gray8" },
    },
  } as const,
  defaultVariants: {
    filled: false,
  },
})

export const CompetitionText = styled(Paragraph, {
  name: "CompetitionText",
  fontSize: "$2",
  color: "$colorSecondary",
})

// Credit cost indicator
export const CreditCost = styled(XStack, {
  name: "CreditCost",
  alignItems: "center",
  gap: "$1",
})

export const CreditText = styled(Paragraph, {
  name: "CreditText",
  fontSize: "$3",
  fontWeight: "600",
  color: "$color",
})
