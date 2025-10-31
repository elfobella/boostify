"use client"

import React, { createContext, useContext, useState } from 'react'

type ModalType = 'login' | 'register' | null

interface LoginModalContextType {
  isOpen: boolean
  modalType: ModalType
  openModal: () => void
  openRegisterModal: () => void
  closeModal: () => void
  switchToRegister: () => void
  switchToLogin: () => void
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined)

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [modalType, setModalType] = useState<ModalType>(null)

  const openModal = () => {
    setModalType('login')
    setIsOpen(true)
  }

  const openRegisterModal = () => {
    setModalType('register')
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setModalType(null)
  }

  const switchToRegister = () => {
    setModalType('register')
  }

  const switchToLogin = () => {
    setModalType('login')
  }

  return (
    <LoginModalContext.Provider value={{ 
      isOpen, 
      modalType,
      openModal, 
      openRegisterModal,
      closeModal,
      switchToRegister,
      switchToLogin
    }}>
      {children}
    </LoginModalContext.Provider>
  )
}

export function useLoginModal() {
  const context = useContext(LoginModalContext)
  if (context === undefined) {
    throw new Error('useLoginModal must be used within a LoginModalProvider')
  }
  return context
}

