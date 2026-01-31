export const AUTH_CARD_BASE_STYLE = {
  width: "100%",
  maxWidth: 600,
  backgroundColor: "$backgroundStrong",
  borderRadius: "$4",
  borderWidth: 1,
  borderColor: "$borderColor",
  padding: "$6",
  paddingTop: 56, // room for logo "badge"
  position: "relative",
} as const

export const AUTH_LOGO_BADGE_STYLE = {
  position: "absolute",
  top: 0,
  left: "50%",
  transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
  backgroundColor: "$background",
  paddingHorizontal: "$4",
  paddingVertical: "$2",
  borderRadius: 9999,
  borderWidth: 1,
  borderColor: "$borderColor",
  alignItems: "center",
  justifyContent: "center",
} as const

