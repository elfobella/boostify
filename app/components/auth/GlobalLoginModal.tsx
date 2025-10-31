"use client"

import { LoginModal } from "./LoginModal"
import { RegisterModal } from "./RegisterModal"
import { useLoginModal } from "@/contexts"

export function GlobalLoginModal() {
  const { isOpen, modalType, closeModal, switchToRegister, switchToLogin } = useLoginModal()

  return (
    <>
      <LoginModal 
        isOpen={isOpen && modalType === 'login'} 
        onClose={closeModal}
        onSwitchToRegister={switchToRegister}
      />
      <RegisterModal 
        isOpen={isOpen && modalType === 'register'} 
        onClose={closeModal}
        onSwitchToLogin={switchToLogin}
      />
    </>
  )
}

