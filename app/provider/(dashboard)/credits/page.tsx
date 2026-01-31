"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Paragraph, XStack, YStack } from "tamagui"
import { Coins, ChevronLeft, Check } from "@tamagui/lucide-icons"
import { DashboardContent } from "components/styled/provider-dashboard"
import { CREDIT_PACKS, formatPrice, type CreditPack } from "lib/provider/constants"

interface CreditPackCardProps {
  pack: CreditPack
  onSelect: () => void
}

function CreditPackCard({ pack, onSelect }: CreditPackCardProps) {
  const totalPrice = pack.credits * pack.pricePerCredit
  const isBestValue = pack.badge === "BEST VALUE"

  return (
    <XStack
      backgroundColor="$backgroundStrong"
      borderRadius="$4"
      padding="$4"
      gap="$4"
      borderWidth={isBestValue ? 2 : 1}
      borderColor={isBestValue ? "$accent6" : "$borderColor"}
      position="relative"
      alignItems="center"
      flexDirection="column"
      $gtSm={{ flexDirection: "row", justifyContent: "space-between" }}
    >
      {pack.badge && (
        <XStack
          position="absolute"
          top={0}
          y="-50%"
          left="$4"
          gap="$2"
        >
          <XStack
            backgroundColor="#50dcaa"
            paddingHorizontal="$3"
            height={24}
            alignItems="center"
            borderRadius={999}
          >
            <Paragraph fontSize="$2" fontWeight="700" color="#1f2937">
              {pack.badge}
            </Paragraph>
          </XStack>
          {isBestValue && (
            <XStack
              backgroundColor="#50dcaa"
              paddingHorizontal="$3"
              height={24}
              alignItems="center"
              borderRadius={999}
            >
              <Paragraph fontSize="$2" fontWeight="700" color="#1f2937">
                15% OFF
              </Paragraph>
            </XStack>
          )}
        </XStack>
      )}

      <YStack gap="$2" marginTop={pack.badge ? "$2" : 0} flex={1} width="100%" $gtSm={{ width: "auto" }}>
        <YStack gap="$1">
          <Paragraph fontSize="$5" fontWeight="600">
            About {pack.responses} responses
          </Paragraph>
          <XStack alignItems="center" gap="$2">
            <Coins size={16} color="$accent6" />
            <Paragraph fontSize="$4" color="$colorSecondary">
              {pack.credits} credits
            </Paragraph>
          </XStack>
        </YStack>

        <XStack alignItems="baseline" gap="$2">
          <Paragraph fontSize="$7" fontWeight="700">
            {formatPrice(totalPrice)}
          </Paragraph>
          <Paragraph fontSize="$3" color="$colorSecondary">
            inc GST
          </Paragraph>
          <Paragraph fontSize="$3" color="$colorSecondary">
            {formatPrice(pack.pricePerCredit)}/credit
          </Paragraph>
        </XStack>
      </YStack>

      <XStack
        backgroundColor="$accent6"
        padding="$3"
        borderRadius="$3"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        hoverStyle={{ opacity: 0.9 }}
        pressStyle={{ opacity: 0.8 }}
        onPress={onSelect}
        width="100%"
        $gtSm={{ width: "auto", paddingHorizontal: "$6" }}
      >
        <Paragraph fontSize="$4" fontWeight="600" color="white">
          Buy credits
        </Paragraph>
      </XStack>
    </XStack>
  )
}

export default function CreditsPage() {
  const router = useRouter()
  const [providerCredits, setProviderCredits] = useState<number>(0)

  useEffect(() => {
    fetch("/api/provider/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setProviderCredits(typeof data?.credits === "number" ? data.credits : 0)
      })
      .catch(() => {
        setProviderCredits(0)
      })
  }, [])

  const handlePurchase = async (_packId: string) => {
    // TODO: Integrate with Stripe for actual payment
    alert("Payment integration coming soon!")
  }

  return (
    <DashboardContent>
      <XStack alignItems="center" gap="$3">
        <YStack
          padding="$2"
          borderRadius="$2"
          cursor="pointer"
          hoverStyle={{ backgroundColor: "$gray4" }}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="$color" />
        </YStack>
        <Paragraph fontSize="$6" fontWeight="600">
          Response Credits
        </Paragraph>
      </XStack>

      <XStack
        backgroundColor="$gray3"
        padding="$4"
        borderRadius="$3"
        alignItems="center"
        justifyContent="space-between"
      >
        <Paragraph fontSize="$4">You have</Paragraph>
        <XStack alignItems="center" gap="$2">
          <Coins size={20} color="$accent6" />
          <Paragraph fontSize="$6" fontWeight="700">
            {providerCredits} credits
          </Paragraph>
        </XStack>
      </XStack>

      <YStack gap="$5" marginTop="$2">
        {CREDIT_PACKS.map((pack) => (
          <CreditPackCard
            key={pack.id}
            pack={pack}
            onSelect={() => handlePurchase(pack.id)}
          />
        ))}
      </YStack>

      <YStack
        backgroundColor="$gray2"
        padding="$4"
        borderRadius="$3"
        gap="$3"
        marginTop="$4"
      >
        <Paragraph fontSize="$4" fontWeight="600">
          How credits work
        </Paragraph>
        <YStack gap="$2">
          <XStack alignItems="flex-start" gap="$2">
            <YStack paddingTop="$1">
              <Check size={16} color="$green9" />
            </YStack>
            <Paragraph fontSize="$3" color="$colorSecondary" flex={1}>
              Credits are used when you contact a customer
            </Paragraph>
          </XStack>
          <XStack alignItems="flex-start" gap="$2">
            <YStack paddingTop="$1">
              <Check size={16} color="$green9" />
            </YStack>
            <Paragraph fontSize="$3" color="$colorSecondary" flex={1}>
              Cost varies by job type and urgency ($15-$50 including GST)
            </Paragraph>
          </XStack>
          <XStack alignItems="flex-start" gap="$2">
            <YStack paddingTop="$1">
              <Check size={16} color="$green9" />
            </YStack>
            <Paragraph fontSize="$3" color="$colorSecondary" flex={1}>
              Credits never expire
            </Paragraph>
          </XStack>
          <XStack alignItems="flex-start" gap="$2">
            <YStack paddingTop="$1">
              <Check size={16} color="$green9" />
            </YStack>
            <Paragraph fontSize="$3" color="$colorSecondary" flex={1}>
              Refunds for invalid leads under our fair use policy
            </Paragraph>
          </XStack>
        </YStack>
      </YStack>
    </DashboardContent>
  )
}
