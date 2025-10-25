'use client'

import React from 'react'
import { motion } from 'framer-motion'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /** Disable hover animation (default: false) */
  noHover?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  noHover = false,
  ...props
}) => {
  // For cards without hover effect, render a regular div
  if (noHover) {
    return (
      <div className={`card ${className}`} {...props}>
        {children}
      </div>
    )
  }

  // For cards with hover effect, use motion.div
  return (
    <motion.div
      className={`card ${className}`}
      whileHover={{
        y: -4,
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
      }}
      transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  )
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

Card.displayName = 'Card'
CardHeader.displayName = 'CardHeader'
CardContent.displayName = 'CardContent'
