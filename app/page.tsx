"use client"

import {
  ArrowRight,
  BrushCleaning,
  Clock,
  Facebook,
  HardHat,
  Instagram,
  LayoutGrid,
  Linkedin,
  Menu,
  Moon,
  Phone,
  RefreshCw,
  Shield,
  Sun,
  Truck,
  Twitter,
  User,
  Users,
  Wrench,
  Zap,
} from "@tamagui/lucide-icons"
import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  type CSSProperties,
  Fragment,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react"
import { H1, styled, Text, useMedia, XStack, YStack } from "tamagui"
import { Button } from "components/Button/Button"
import { LogoImage } from "components/Logo/LogoImage"
import { useTheme } from "lib/theme"

// Header components
const HeaderContainer = styled(YStack, {
  name: "HeaderContainer",
  zIndex: 1000,
  width: "100%",
  paddingHorizontal: "$4",
  backgroundColor: "transparent",
  marginBottom: 10,
  paddingBottom: 10,
})

const HeaderBar = styled(XStack, {
  name: "HeaderBar",
  // Note: We apply `display: grid` via `style` because Tamagui's typing for
  // `display` doesn't include "grid" (even though the CSS output supports it).
  width: "100%",
  maxWidth: 1280,
  marginHorizontal: "auto",
  paddingHorizontal: "$5",
  paddingVertical: "$3",
  backgroundColor: "$primary7",
  borderRadius: "$4",
  alignItems: "center",
  minHeight: 56,
  "$sm": {
    paddingHorizontal: "$3",
    paddingVertical: "$2",
    minHeight: 48,
  },
})

const HeaderLeftGroup = styled(XStack, {
  name: "HeaderLeftGroup",
  alignItems: "center",
  gap: "$4",
  flex: 1,
})

const HeaderRightGroup = styled(XStack, {
  name: "HeaderRightGroup",
  alignItems: "center",
  gap: 5,
  flex: 1,
  justifyContent: "flex-end",
})

const HeaderMenuButton = styled(YStack, {
  name: "HeaderMenuButton",
  width: 40,
  height: 40,
  borderRadius: "$6",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  hoverStyle: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
})

const HeaderLogoGroup = styled(XStack, {
  name: "HeaderLogoGroup",
  alignItems: "center",
  gap: "$3",
  cursor: "pointer",
  transform: "scale(1.1)",
  hoverStyle: {
    transform: "scale(1.21)",
  },
  transition: "transform 0.2s ease",
})

const HeaderThemeButton = styled(YStack, {
  name: "HeaderThemeButton",
  width: 40,
  height: 40,
  borderRadius: "$6",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  hoverStyle: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
})

const HeaderUserButton = styled(XStack, {
  name: "HeaderUserButton",
  alignItems: "center",
  gap: "$2",
  cursor: "pointer",
  paddingVertical: "$1",
  // Desktop: keep left padding equal to top/bottom padding.
  paddingLeft: "$1",
  paddingRight: 15,
  borderRadius: "$6",
  "$sm": {
    // Mobile: icon-only button.
    paddingHorizontal: "$1",
  },
  hoverStyle: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
})

const HeaderUserAvatar = styled(YStack, {
  name: "HeaderUserAvatar",
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: "white",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
})

const HeaderUserLabel = styled(Text, {
  name: "HeaderUserLabel",
  fontSize: "$4",
  fontWeight: "500",
  color: "white",
  "$sm": {
    display: "none",
  },
})

// Hero Section
const HeroSection = styled(YStack, {
  name: "HeroSection",
  position: "relative",
  overflow: "hidden",
  width: "100%",
  paddingTop: 0,
  paddingBottom: 0,
  paddingHorizontal: "$4",
  backgroundColor: "transparent",
})

const HeroBlurBackground = styled(YStack, {
  name: "HeroBlurBackground",
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: -1,
})

const BlurCircle = styled(YStack, {
  name: "BlurCircle",
  position: "absolute",
  borderRadius: 9999,
  opacity: 0.3,
})

const HeroContainer = styled(YStack, {
  name: "HeroContainer",
  maxWidth: 1280,
  width: "100%",
  marginHorizontal: "auto",
  position: "relative",
  alignItems: "center",
  gap: "$8",
  borderWidth: 1,
  borderColor: "rgba(0, 0, 0, 0.1)",
  borderRadius: "$4",
  paddingTop: 100,
  paddingBottom: 100,
  paddingHorizontal: 20,
  backgroundColor: "#f5f5f5",
  overflow: "hidden",
  "$sm": {
    paddingTop: 70,
    paddingBottom: 70,
    paddingHorizontal: 30,
    gap: "$6",
  },
  "$gtSm": {
    alignItems: "flex-start",
    paddingHorizontal: 50,
  },
})

const HeroTop = styled(XStack, {
  name: "HeroTop",
  width: "100%",
  alignItems: "center",
  gap: "$8",
  flexDirection: "column",
  "$sm": {
    gap: "$6",
  },
  "$gtSm": {
    flexDirection: "row",
    alignItems: "flex-start",
  },
})

const HeroTextColumn = styled(YStack, {
  name: "HeroTextColumn",
  minWidth: 0,
  gap: "$3",
  alignItems: "center",
  paddingLeft: 0,
  "$gtSm": {
    alignItems: "flex-start",
  },
})

const HeroBadge = styled(XStack, {
  name: "HeroBadge",
  alignItems: "center",
  gap: "$2",
  paddingHorizontal: "$4",
  paddingVertical: "$2",
  borderRadius: 9999,
  backgroundColor: "rgba(1, 164, 147, 0.1)",
  alignSelf: "center",
  "$gtSm": {
    alignSelf: "flex-start",
  },
})

const HeroBadgeText = styled(Text, {
  name: "HeroBadgeText",
  fontSize: "$3",
  fontWeight: "500",
  color: "$primary7",
})

const HeroHeading = styled(H1, {
  name: "HeroHeading",
  fontSize: "$10",
  fontWeight: "800",
  textAlign: "center",
  color: "$gray9",
  letterSpacing: -0.02,
  maxWidth: 900,
  width: "100%",
  "$sm": {
    fontSize: "$9",
    lineHeight: 40,
  },
  "$gtSm": {
    textAlign: "left",
  },
})

const HERO_GRADIENT_STYLE = { color: "#01a493" }

// HeroHeadingBreak removed - using regular <br /> tag for line break

const HeroDescription = styled(Text, {
  name: "HeroDescription",
  fontSize: "$6",
  color: "$colorSecondary",
  textAlign: "center",
  maxWidth: 600,
  lineHeight: 30,
  width: "100%",
  "$sm": {
    fontSize: "$5",
    lineHeight: 26,
  },
  "$gtSm": {
    textAlign: "left",
  },
})

const HeroBenefits = styled(XStack, {
  name: "HeroBenefits",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  gap: "$3",
  "$gtSm": {
    justifyContent: "flex-start",
  },
})

const HeroBenefitItem = styled(XStack, {
  name: "HeroBenefitItem",
  alignItems: "center",
  gap: "$2",
})

const HeroBenefitText = styled(Text, {
  name: "HeroBenefitText",
  fontSize: "$3",
  color: "$colorSecondary",
})

const BenefitDot = styled(YStack, {
  name: "BenefitDot",
  width: 4,
  height: 4,
  borderRadius: 2,
  backgroundColor: "$borderColor",
})

// Services Section
const ServicesSection = styled(YStack, {
  name: "ServicesSection",
  width: "100%",
  paddingTop: "$2",
  paddingBottom: 0,
  // Keep inner content aligned with the hero copy; `HeroContainer` already provides
  // the outer gutter/padding across breakpoints.
  paddingHorizontal: 0,
})

const ServicesContainer = styled(YStack, {
  name: "ServicesContainer",
  maxWidth: 1280,
  width: "100%",
  marginHorizontal: "auto",
  gap: "$8",
  "$sm": {
    gap: "$6",
  },
})

const SectionHeading = styled(H1, {
  name: "SectionHeading",
  fontSize: "$9",
  fontWeight: "800",
  textAlign: "center",
  color: "$gray9",
  marginBottom: "$4",
})

const SectionDescription = styled(Text, {
  name: "SectionDescription",
  fontSize: "$6",
  color: "$colorSecondary",
  textAlign: "center",
  maxWidth: 600,
  marginHorizontal: "auto",
})

const ServicesGrid = styled(XStack, {
  name: "ServicesGrid",
  flexWrap: "wrap",
  gap: "$4",
  justifyContent: "flex-start",
  maxWidth: 1280,
  width: "100%",
  alignSelf: "flex-start",
})

const ServiceCard = styled(YStack, {
  name: "ServiceCard",
  flex: 1,
  minWidth: 140,
  maxWidth: 160,
  alignItems: "center",
  justifyContent: "center",
  gap: "$3",
  padding: "$6",
  borderRadius: "$4",
  backgroundColor: "$background",
  borderWidth: 2,
  borderColor: "rgba(0, 0, 0, 0.1)",
  boxSizing: "border-box",
  cursor: "pointer",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  hoverStyle: {
    borderColor: "$green",
    shadowColor: "$shadowColor",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ translateY: -4 }],
  },
  pressStyle: {
    transform: [{ scale: 0.98 }],
  },
  "$sm": {
    flex: 0,
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    padding: "$4",
    gap: "$2",
  },
})

const ServiceIconContainer = styled(YStack, {
  name: "ServiceIconContainer",
  width: 56,
  height: 56,
  borderRadius: "$3",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "$sm": {
    width: 48,
    height: 48,
  },
})

const ServiceName = styled(Text, {
  name: "ServiceName",
  fontSize: "$3",
  fontWeight: "500",
  color: "$gray9",
  textAlign: "center",
  lineHeight: 18,
  minHeight: 36,
})

// How It Works Section
const HowItWorksSection = styled(YStack, {
  name: "HowItWorksSection",
  width: "100%",
  paddingVertical: "$18",
  paddingHorizontal: "$4",
  "$sm": {
    paddingVertical: "$18",
  },
})

const HowItWorksContainer = styled(YStack, {
  name: "HowItWorksContainer",
  maxWidth: 1280,
  width: "100%",
  marginHorizontal: "auto",
  gap: "$8",
})

const HowItWorksGrid = styled(XStack, {
  name: "HowItWorksGrid",
  width: "100%",
  gap: "$8",
  flexDirection: "column",
})

const HowItWorksDivider = styled(YStack, {
  name: "HowItWorksDivider",
  width: 1,
  backgroundColor: "rgba(0, 0, 0, 0.1)",
  height: "100%",
  "$sm": {
    display: "none",
  },
})

const HowItWorksIntro = styled(YStack, {
  name: "HowItWorksIntro",
  alignItems: "center",
  gap: "$2",
  "$gtSm": {
    alignItems: "flex-start",
    alignSelf: "stretch",
    justifyContent: "center",
  },
})

const Step = styled(YStack, {
  name: "Step",
  alignItems: "center",
  gap: "$3",
  flex: 1,
  minWidth: 280,
  maxWidth: 320,
  "$gtSm": {
    minWidth: 0,
    maxWidth: "100%",
  },
  "$sm": {
    minWidth: 240,
  },
  "$xs": {
    minWidth: "100%",
    maxWidth: "100%",
  },
})

const StepNumber = styled(YStack, {
  name: "StepNumber",
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: "$primary7",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "$shadowColor",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 4,
})

const StepNumberText = styled(Text, {
  name: "StepNumberText",
  fontSize: "$6",
  fontWeight: "800",
  color: "white",
})

const StepTitle = styled(Text, {
  name: "StepTitle",
  fontSize: "$5",
  fontWeight: "700",
  color: "$gray9",
})

const StepDescription = styled(Text, {
  name: "StepDescription",
  fontSize: "$4",
  color: "$colorSecondary",
  textAlign: "center",
  maxWidth: 280,
  "$gtSm": {
    maxWidth: "100%",
  },
})

// Why Different Section
const WhyDifferentSection = styled(YStack, {
  name: "WhyDifferentSection",
  width: "100%",
  paddingVertical: "$18",
  paddingHorizontal: "$4",
  backgroundColor: "#f5f5f5",
  "$sm": {
    paddingVertical: "$18",
  },
})

const WhyDifferentContainer = styled(YStack, {
  name: "WhyDifferentContainer",
  maxWidth: 1280,
  width: "100%",
  marginHorizontal: "auto",
  gap: "$8",
})

const WhyDifferentBadge = styled(XStack, {
  name: "WhyDifferentBadge",
  alignItems: "center",
  gap: "$2",
  paddingHorizontal: "$3",
  paddingVertical: "$2",
  borderRadius: 9999,
  backgroundColor: "rgba(1, 164, 147, 0.1)",
  alignSelf: "center",
})

const WhyDifferentBadgeText = styled(Text, {
  name: "WhyDifferentBadgeText",
  fontSize: "$3",
  fontWeight: "500",
  color: "$accent6",
})

const BenefitGrid = styled(XStack, {
  name: "BenefitGrid",
  flexWrap: "wrap",
  gap: "$4",
  justifyContent: "center",
  maxWidth: 900,
  marginHorizontal: "auto",
  "$sm": {
    gap: "$3",
  },
})

const BenefitCard = styled(XStack, {
  name: "BenefitCard",
  flex: 1,
  minWidth: 280,
  maxWidth: 400,
  alignItems: "flex-start",
  alignContent: "flex-start",
  gap: "$4",
  padding: "$5",
  borderRadius: "$4",
  backgroundColor: "$background",
  borderWidth: 1,
  borderColor: "rgba(0, 0, 0, 0.1)",
  hoverStyle: {
    borderColor: "rgba(24, 65, 83, 0.2)",
    shadowColor: "$shadowColor",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  "$sm": {
    minWidth: 240,
  },
  "$xs": {
    minWidth: "100%",
    maxWidth: "100%",
  },
})

const BenefitIcon = styled(YStack, {
  name: "BenefitIcon",
  width: 40,
  height: 40,
  borderRadius: 9999,
  backgroundColor: "rgba(1, 164, 147, 0.1)",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
})

const BenefitContent = styled(YStack, {
  name: "BenefitContent",
  gap: "$3",
  flex: 1,
})

const BenefitTitle = styled(Text, {
  name: "BenefitTitle",
  fontSize: "$5",
  fontWeight: "700",
  color: "$gray9",
})

const BenefitDescription = styled(Text, {
  name: "BenefitDescription",
  fontSize: "$3",
  color: "$colorSecondary",
})

// CTA Section
const CTASection = styled(YStack, {
  name: "CTASection",
  width: "100%",
  paddingVertical: "$18",
  paddingHorizontal: "$4",
  "$sm": {
    paddingVertical: "$18",
  },
})

const CTAContainer = styled(YStack, {
  name: "CTAContainer",
  maxWidth: 1280,
  width: "100%",
  marginHorizontal: "auto",
  position: "relative",
  overflow: "hidden",
  borderRadius: "$6",
  padding: "$10",
  backgroundColor: "$primary7",
  alignItems: "center",
  gap: "$6",
  "$sm": {
    padding: "$7",
    gap: "$4",
  },
})

const CTABlurBackground = styled(YStack, {
  name: "CTABlurBackground",
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 0,
})

const CTAContent = styled(YStack, {
  name: "CTAContent",
  position: "relative",
  zIndex: 10,
  alignItems: "center",
  gap: "$4",
})

const CTAHeading = styled(H1, {
  name: "CTAHeading",
  fontSize: "$9",
  fontWeight: "800",
  color: "white",
  textAlign: "center",
  "$sm": {
    fontSize: "$8",
  },
})

const CTADescription = styled(Text, {
  name: "CTADescription",
  fontSize: "$6",
  color: "rgba(255, 255, 255, 0.8)",
  textAlign: "center",
  maxWidth: 600,
  "$sm": {
    fontSize: "$5",
  },
})

// Footer Section
const Footer = styled(YStack, {
  name: "Footer",
  width: "100%",
  borderTopWidth: 1,
  borderTopColor: "rgba(0, 0, 0, 0.1)",
  backgroundColor: "rgba(245, 245, 245, 0.3)",
  paddingVertical: "$6",
  paddingHorizontal: "$4",
})

const FooterContainer = styled(YStack, {
  name: "FooterContainer",
  maxWidth: 1280,
  width: "100%",
  marginHorizontal: "auto",
  gap: "$10",
})

const FooterGrid = styled(XStack, {
  name: "FooterGrid",
  flexWrap: "wrap",
  gap: "$8",
  "$sm": {
    gap: "$6",
  },
})

const FooterColumn = styled(YStack, {
  name: "FooterColumn",
  flex: 1,
  minWidth: 150,
  gap: "$4",
  "$xs": {
    minWidth: "100%",
  },
})

const FooterBrandColumn = styled(YStack, {
  name: "FooterBrandColumn",
  flex: 1,
  minWidth: 150,
  gap: "$4",
  "$xs": {
    minWidth: "100%",
  },
})

const FooterLogoGroup = styled(XStack, {
  name: "FooterLogoGroup",
  alignItems: "center",
  gap: "$4",
  marginBottom: "$4",
  flexWrap: "wrap",
})

const FooterSocialLinks = styled(XStack, {
  name: "FooterSocialLinks",
  alignItems: "center",
  gap: "$3",
})

const SOCIAL_LINKS = [
  { href: "https://www.facebook.com/NeededNZ/", icon: Facebook, label: "Facebook" },
  { href: "https://www.instagram.com/needed.co.nz/", icon: Instagram, label: "Instagram" },
  { href: "https://twitter.com/NeededNZ/", icon: Twitter, label: "Twitter" },
  { href: "https://www.linkedin.com/company/needed/", icon: Linkedin, label: "LinkedIn" },
] as const

const FooterBrandDescription = styled(Text, {
  name: "FooterBrandDescription",
  fontSize: "$3",
  color: "$colorSecondary",
  lineHeight: 1.6,
})

const FooterColumnTitle = styled(Text, {
  name: "FooterColumnTitle",
  fontSize: "$3",
  fontWeight: "600",
  color: "$gray9",
  marginBottom: "$3",
})

const FooterLinkList = styled(YStack, {
  name: "FooterLinkList",
  gap: "$2",
})

const FooterLink = styled(Text, {
  name: "FooterLink",
  fontSize: "$3",
  color: "$colorSecondary",
  cursor: "pointer",
  hoverStyle: {
    color: "$gray9",
  },
})

const FooterBottom = styled(XStack, {
  name: "FooterBottom",
  marginTop: "$10",
  paddingTop: "$6",
  borderTopWidth: 1,
  borderTopColor: "rgba(0, 0, 0, 0.1)",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "$4",
})

const FooterCopyright = styled(Text, {
  name: "FooterCopyright",
  fontSize: "$3",
  color: "$colorSecondary",
})

const FooterMadeIn = styled(XStack, {
  name: "FooterMadeIn",
  alignItems: "center",
  gap: 6,
})

const FooterMadeInText = styled(Text, {
  name: "FooterMadeInText",
  fontSize: "$2",
  color: "$colorSecondary",
})

const LOGO_LINK_STYLE = { display: "flex", alignItems: "center" }
const LOGO_IMAGE_STYLE = { height: "32px", width: "auto" }
const LINK_RESET_STYLE = { textDecoration: "none" }
const CTA_LINK_STYLE = { textDecoration: "none", display: "inline-flex" }
const CTA_ARROW_STYLE = { marginLeft: "5px", display: "inline-flex", alignItems: "center" }

type AppRoute =
  | `/request${string}`
  | "/about"
  | "/blog"
  | "/contact"
  | "/privacy"
  | "/terms"
  | "/for-pros"

// Top services
const TOP_SERVICES: Array<{ slug: string; name: string; icon: typeof Wrench; href?: AppRoute }> = [
  { slug: "plumber", name: "Plumber", icon: Wrench },
  { slug: "electrician", name: "Electrician", icon: Zap },
  { slug: "handyman", name: "Handyman", icon: HardHat },
  { slug: "movers", name: "Movers", icon: Truck },
  { slug: "house-cleaning", name: "House cleaners", icon: BrushCleaning },
  { slug: "all-services", name: "See all services", icon: LayoutGrid, href: "/request/services" },
]

const HERO_BENEFITS = [
  { icon: Users, text: "3 pros notified" },
  { icon: Clock, text: "10 min response" },
  { icon: Shield, text: "No account required" },
]

const HOW_IT_WORKS_STEPS = [
  {
    number: "1",
    title: "Tell us what you need",
    description: "Pick a service, choose your timing, and describe the job in a few words.",
  },
  {
    number: "2",
    title: "We notify 3 pros",
    description: "Your request goes to up to 3 available pros in your area at the same time.",
  },
  {
    number: "3",
    title: "Get contacted directly",
    description:
      "Pros call or text you directly. If no reply in 10 mins, resend to 3 more.",
  },
]

const WHY_DIFFERENT_BENEFITS = [
  {
    icon: Users,
    title: "Sent to up to 3 available pros",
    description:
      "We only send your request to pros who are available and cover your area.",
  },
  {
    icon: Clock,
    title: "Hear back within 10 minutes",
    description:
      "Available pros respond fast. Most customers hear back in under 10 minutes.",
  },
  {
    icon: RefreshCw,
    title: "Didn't hear back? Re-send",
    description: "If you don't hear back in 10 minutes, re-send to 3 more with one tap.",
  },
  {
    icon: Phone,
    title: "Pros contact you directly",
    description:
      "No marketplace noise. Pros call or text you directly about your job.",
  },
]

const FOOTER_LINK_SECTIONS: Array<{
  title: string
  links: Array<{ label: string; href: AppRoute }>
}> = [
  {
    title: "Services",
    links: [
      { label: "Plumber", href: "/request?service=plumber" },
      { label: "Electrician", href: "/request?service=electrician" },
      { label: "Locksmith", href: "/request?service=locksmith" },
      { label: "All services", href: "/request/services" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "For Pros", href: "/for-pros" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
]

export default function Web() {
  const { theme, toggleTheme } = useTheme()
  const media = useMedia()
  const isTablet = media.gtSm && media.md
  const isDesktop = media.gtMd
  const isWide = media.gtSm
  const isDark = theme === "dark"
  const [showHeader, setShowHeader] = useState(true)
  const lastScrollYRef = useRef(0)
  const tickingRef = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) {
        return
      }
      tickingRef.current = true
      requestAnimationFrame(() => {
        const currentY = window.scrollY
        const lastY = lastScrollYRef.current
        const delta = currentY - lastY

        if (currentY <= 10) {
          setShowHeader(true)
        } else if (delta > 2) {
          setShowHeader(false)
        } else if (delta < -2) {
          setShowHeader(true)
        }

        lastScrollYRef.current = currentY
        tickingRef.current = false
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleKeyActivate = (
    event: KeyboardEvent<HTMLElement>,
    onActivate: () => void
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onActivate()
    }
  }

  const handleKeyClick = (event: KeyboardEvent<HTMLElement>) => {
    handleKeyActivate(event, () => {
      ;(event.currentTarget as HTMLElement).click()
    })
  }

  const handleKeyToggleTheme = (event: KeyboardEvent<HTMLElement>) => {
    handleKeyActivate(event, toggleTheme)
  }

  const headerContainerStyle: CSSProperties = {
    // Use inline CSS here because Tamagui's `position` typing doesn't include "sticky".
    position: "sticky",
    top: 10,
  }

  const headerStyle: CSSProperties = {
    transform: showHeader ? "translateY(0)" : "translateY(-120%)",
    opacity: showHeader ? 1 : 0,
    transition: "transform 0.10s ease, opacity 0.10s ease",
    pointerEvents: showHeader ? "auto" : "none",
  }

  const headerBarLayoutStyle: CSSProperties = {
    // Keep logo perfectly centered between left/right controls.
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
  }

  const heroAlign = isWide ? "flex-start" : "center"
  const heroTextAlign = isWide ? "left" : "center"
  const heroTextPadding = 0
  const heroContainerBg = isDark ? "#2a2a2a" : "#f5f5f5"
  const heroContainerBorderColor = isDark
    ? "rgba(255, 255, 255, 0.2)"
    : "rgba(0, 0, 0, 0.1)"
  const heroBadgeBg = isDark ? "rgba(80, 220, 170, 0.15)" : "rgba(1, 164, 147, 0.1)"
  const heroBadgeAccent = isDark ? "white" : "#184153"
  const heroBadgeTextColor = isDark ? "white" : "$primary7"
  const heroHeadingColor = isDark ? "white" : "$gray9"
  const heroBenefitsJustify = isWide ? "flex-start" : "center"
  const servicesTitleColor = isDark ? "white" : "$gray9"
  const serviceIconColor = isDark ? "#01a493" : "#184153"
  const serviceNameColor = isDark ? "#01a493" : "$gray9"
  const glassCardBg = isDark ? "rgba(31, 31, 31, 0.55)" : "rgba(255, 255, 255, 0.55)"
  const glassCardStyle: CSSProperties = {
    backgroundColor: glassCardBg,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  }
  const heroBgImage = isWide ? "url(/woman-using-needed-on-her-phone.png)" : "none"
  const footerSocialHoverBg = isDark ? "#1f1f1f" : "#e5e5e5"

  const servicesGridStyle: CSSProperties | undefined = isDesktop
    ? undefined
    : {
        display: "grid",
        gridTemplateColumns: isTablet
          ? "repeat(3, minmax(0, 1fr))"
          : "repeat(2, minmax(0, 1fr))",
        gap: 10,
        justifyContent: "stretch",
        alignItems: "stretch",
        width: "100%",
        maxWidth: "100%",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
      }

  const serviceLinkStyle = {
    ...LINK_RESET_STYLE,
    display: "flex",
    width: isDesktop ? "auto" : "100%",
  }

  const serviceCardWidthProps = {
    width: isDesktop ? undefined : "100%",
    maxWidth: isDesktop ? 150 : "100%",
    minWidth: isDesktop ? 150 : 0,
  }

  const howItWorksGridStyle = isDesktop
    ? {
        display: "grid",
        gridTemplateColumns: "1fr 1px 1fr 1fr 1fr",
        alignItems: "center",
      }
    : undefined

  return (
    <>
      {/* Header */}
      <HeaderContainer style={headerContainerStyle}>
        <HeaderBar
          id="homepage-header-bar"
          style={{ ...headerBarLayoutStyle, ...headerStyle }}
        >
          <HeaderLeftGroup>
            <HeaderMenuButton
              role="button"
              aria-label="Open menu"
              tabIndex={0}
              onKeyDown={handleKeyClick}
            >
              <Menu size={20} color="white" />
            </HeaderMenuButton>
          </HeaderLeftGroup>
          <HeaderLogoGroup>
            <Link href="/" style={LOGO_LINK_STYLE}>
              <LogoImage variant="dark" priority style={LOGO_IMAGE_STYLE} />
            </Link>
          </HeaderLogoGroup>
          <HeaderRightGroup>
            <HeaderThemeButton
              role="button"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              tabIndex={0}
              onPress={toggleTheme}
              onKeyDown={handleKeyToggleTheme}
            >
              {theme === "light" ? (
                <Moon size={20} color="white" />
              ) : (
                <Sun size={20} color="white" />
              )}
            </HeaderThemeButton>
            <HeaderUserButton
              role="button"
              aria-label="Sign in"
              tabIndex={0}
              onKeyDown={handleKeyClick}
            >
              <HeaderUserAvatar>
                <User size={18} color="$primary7" />
              </HeaderUserAvatar>
              <HeaderUserLabel>Sign in</HeaderUserLabel>
            </HeaderUserButton>
          </HeaderRightGroup>
        </HeaderBar>
      </HeaderContainer>

      {/* Hero Section */}
      <HeroSection>
        <HeroBlurBackground>
          <BlurCircle
            position="absolute"
            top={0}
            right={0}
            width={600}
            height={600}
            backgroundColor="rgba(24, 65, 83, 0.05)"
            style={{
              transform: [{ translateX: 300 }, { translateY: -300 }],
              filter: "blur(80px)",
            }}
          />
          <BlurCircle
            position="absolute"
            bottom={0}
            left={0}
            width={400}
            height={400}
            backgroundColor="rgba(1, 164, 147, 0.05)"
            style={{
              transform: [{ translateX: -200 }, { translateY: 200 }],
              filter: "blur(80px)",
            }}
          />
        </HeroBlurBackground>

        <HeroContainer
          backgroundColor={heroContainerBg}
          borderColor={heroContainerBorderColor}
          backgroundImage={heroBgImage}
          backgroundRepeat="no-repeat"
          backgroundSize="contain"
          backgroundPosition="calc(100% - 20px) 20px"
        >
          <HeroTop>
            <HeroTextColumn
              alignItems={heroAlign}
              alignSelf={heroAlign}
              paddingLeft={heroTextPadding}
              width="100%"
            >
              <HeroBadge
                alignSelf={heroAlign}
                backgroundColor={heroBadgeBg}
              >
                <Clock size={16} color={heroBadgeAccent} />
                <HeroBadgeText color={heroBadgeTextColor}>
                  Hear back in 10 minutes
                </HeroBadgeText>
              </HeroBadge>

              <HeroHeading
                color={heroHeadingColor}
                alignSelf={heroAlign}
                textAlign={heroTextAlign}
              >
                The service you need,{" "}
                <span style={HERO_GRADIENT_STYLE}>when you need it</span>
              </HeroHeading>

              <HeroDescription
                alignSelf={heroAlign}
                textAlign={heroTextAlign}
              >
                Pick a service. Send your request in under 60 seconds. Up to 3
                available pros will contact you directly.
              </HeroDescription>
            </HeroTextColumn>
          </HeroTop>


          {/* Services Section */}
          <ServicesSection id="services">
            <ServicesContainer>
              <Text
                fontSize="$4"
                fontWeight="600"
                color={servicesTitleColor}
                alignSelf={heroAlign}
                marginBottom={0}
              >
                Most popular
              </Text>
            <ServicesGrid
              justifyContent={isDesktop ? "flex-start" : undefined}
              alignItems={isDesktop ? "center" : undefined}
              width="100%"
              style={servicesGridStyle}
            >
              {TOP_SERVICES.map((service, index) => (
                <Link
                  key={service.slug}
                  // TODO: Remove cast once `AppRoute` is aligned with Next typed routes.
                  href={
                    (service.href ?? `/request/time?service=${service.slug}`) as Route
                  }
                  style={serviceLinkStyle}
                >
                  <ServiceCard
                    alignSelf="center"
                    className="popular-service-card"
                    borderColor={heroContainerBorderColor}
                    style={
                      {
                        ["--delay"]: `${index * 70}ms`,
                        ...glassCardStyle,
                      } as React.CSSProperties
                    }
                    {...serviceCardWidthProps}
                  >
                    <ServiceIconContainer>
                      <service.icon
                        size={28}
                        color={serviceIconColor}
                      />
                    </ServiceIconContainer>
                    <ServiceName color={serviceNameColor}>
                      {service.name}
                    </ServiceName>
                  </ServiceCard>
                </Link>
              ))}
              </ServicesGrid>

              <HeroBenefits justifyContent={heroBenefitsJustify} alignSelf={heroAlign}>
                {HERO_BENEFITS.map((benefit, index) => {
                  const BenefitIconComponent = benefit.icon
                  return (
                    <Fragment key={benefit.text}>
                      <HeroBenefitItem>
                        <BenefitIconComponent size={16} color="#01a493" />
                        <HeroBenefitText>{benefit.text}</HeroBenefitText>
                      </HeroBenefitItem>
                      {index < HERO_BENEFITS.length - 1 ? <BenefitDot /> : null}
                    </Fragment>
                  )
                })}
              </HeroBenefits>

            </ServicesContainer>
          </ServicesSection>
        </HeroContainer>
      </HeroSection>

      {/* How It Works Section */}
      <HowItWorksSection id="how-it-works">
        <HowItWorksContainer>
          <HowItWorksGrid style={howItWorksGridStyle}>
            <HowItWorksIntro
              alignItems={isDesktop ? "flex-start" : "center"}
            >
              <SectionHeading
                textAlign={isDesktop ? "left" : "center"}
                color={isDark ? "white" : undefined}
              >
                How it works
              </SectionHeading>
              <SectionDescription
                textAlign={isDesktop ? "left" : "center"}
                marginHorizontal={isDesktop ? 0 : "auto"}
              >
                Get help in 3 simple steps. It takes less than 60 seconds.
              </SectionDescription>
            </HowItWorksIntro>

            {isDesktop ? (
              <HowItWorksDivider backgroundColor={heroContainerBorderColor} />
            ) : null}

            {HOW_IT_WORKS_STEPS.map((step) => (
              <Step key={step.number}>
                <StepNumber>
                  <StepNumberText>{step.number}</StepNumberText>
                </StepNumber>
                <StepTitle color={isDark ? "white" : undefined}>
                  {step.title}
                </StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </Step>
            ))}
          </HowItWorksGrid>
        </HowItWorksContainer>
      </HowItWorksSection>

      {/* Why Different Section */}
      <WhyDifferentSection backgroundColor={heroContainerBg}>
        <WhyDifferentContainer>
          <YStack alignItems="center" gap="$4">
            <WhyDifferentBadge>
              <Clock size={16} color={heroBadgeAccent} />
              <WhyDifferentBadgeText color={heroBadgeTextColor}>
                Our 10-minute promise
              </WhyDifferentBadgeText>
            </WhyDifferentBadge>
            <SectionHeading color={isDark ? "white" : undefined}>
              Why Needed is different
            </SectionHeading>
            <SectionDescription>
              Speed matters when you need help. We built Needed to get you
              sorted faster.
            </SectionDescription>
          </YStack>

          <BenefitGrid>
            {WHY_DIFFERENT_BENEFITS.map((benefit) => {
              const BenefitItemIcon = benefit.icon
              return (
                <BenefitCard key={benefit.title} borderColor={heroContainerBorderColor}>
                  <BenefitIcon>
                    <BenefitItemIcon size={20} color="#01a493" />
                  </BenefitIcon>
                  <BenefitContent>
                    <BenefitTitle color={isDark ? "white" : undefined}>
                      {benefit.title}
                    </BenefitTitle>
                    <BenefitDescription>{benefit.description}</BenefitDescription>
                  </BenefitContent>
                </BenefitCard>
              )
            })}
          </BenefitGrid>
        </WhyDifferentContainer>
      </WhyDifferentSection>

      {/* CTA Section */}
      <CTASection>
        <CTAContainer>
          <CTABlurBackground>
            <BlurCircle
              position="absolute"
              top={0}
              right={0}
              width={300}
              height={300}
              backgroundColor="rgba(255, 255, 255, 0.1)"
              style={{
                transform: [{ translateX: 150 }, { translateY: -150 }],
                filter: "blur(80px)",
              }}
            />
            <BlurCircle
              position="absolute"
              bottom={0}
              left={0}
              width={200}
              height={200}
              backgroundColor="rgba(255, 255, 255, 0.05)"
              style={{
                transform: [{ translateX: -100 }, { translateY: 100 }],
                filter: "blur(60px)",
              }}
            />
          </CTABlurBackground>

          <CTAContent>
            <CTAHeading>Ready to get help?</CTAHeading>
            <CTADescription>
              Submit a request in under 60 seconds. No account required.
            </CTADescription>
            <Link href="/request" style={CTA_LINK_STYLE}>
              <Button size="lg" intent="primary" data-button-arrow="true">
                Get started now
                <span style={CTA_ARROW_STYLE}>
                  <ArrowRight size={20} color="white" />
                </span>
              </Button>
            </Link>
          </CTAContent>
        </CTAContainer>
      </CTASection>

      {/* Footer */}
      <Footer
        backgroundColor={heroContainerBg}
        borderTopColor={heroContainerBorderColor}
      >
        <FooterContainer>
          <FooterGrid>
            <FooterBrandColumn>
              <FooterLogoGroup>
                <Link href="/" style={LOGO_LINK_STYLE}>
                  <LogoImage
                    variant={isDark ? "dark" : "light"}
                    style={LOGO_IMAGE_STYLE}
                  />
                </Link>
                <FooterSocialLinks>
                  {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={LINK_RESET_STYLE}
                      aria-label={label}
                    >
                      <YStack
                        alignItems="center"
                        justifyContent="center"
                        width={36}
                        height={36}
                        borderRadius={18}
                        hoverStyle={{ backgroundColor: footerSocialHoverBg }}
                        cursor="pointer"
                      >
                        <Icon size={20} color="$colorSecondary" />
                      </YStack>
                    </Link>
                  ))}
                </FooterSocialLinks>
              </FooterLogoGroup>
              <FooterBrandDescription>
                Get practical help fast. We connect you with available local pros
                in minutes.
              </FooterBrandDescription>
            </FooterBrandColumn>

            {FOOTER_LINK_SECTIONS.map((section) => (
              <FooterColumn key={section.title}>
                <FooterColumnTitle>{section.title}</FooterColumnTitle>
                <FooterLinkList>
                  {section.links.map((link) => (
                    <Link
                      key={link.label}
                      // TODO: Remove cast once `AppRoute` is aligned with Next typed routes.
                      href={link.href as Route}
                      style={LINK_RESET_STYLE}
                    >
                      <FooterLink>{link.label}</FooterLink>
                    </Link>
                  ))}
                </FooterLinkList>
              </FooterColumn>
            ))}
          </FooterGrid>

          <FooterBottom>
            <FooterCopyright>
              © {new Date().getFullYear()} Needed.co.nz. All rights reserved.
            </FooterCopyright>
            <FooterMadeIn>
              <FooterMadeInText>Made in New Zealand</FooterMadeInText>
              <Image
                src="/nz.png"
                alt="New Zealand"
                width={16}
                height={16}
                style={{ display: "block" }}
              />
            </FooterMadeIn>
          </FooterBottom>
        </FooterContainer>
      </Footer>
    </>
  )
}
