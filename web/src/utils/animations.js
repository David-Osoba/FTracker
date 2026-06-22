// Reusable Framer Motion Variants for tactile haptic feedback and page motion

export const hapticButton = {
  tap: {
    scale: 0.96,
    transition: { type: "spring", stiffness: 450, damping: 12 }
  }
}

export const hapticFab = {
  tap: {
    scale: 0.92,
    transition: { type: "spring", stiffness: 550, damping: 10 }
  }
}

export const fabSuccessRotation = {
  rotate360: {
    rotate: 360,
    transition: { type: "spring", stiffness: 220, damping: 14 }
  }
}

export const rowDeleteShake = {
  shake: {
    x: [0, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 }
  }
}

export const containerStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
}

export const cardEntry = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
}
