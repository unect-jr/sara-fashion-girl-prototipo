import { motion, type HTMLMotionProps } from 'motion/react'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonStyles'

type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      className={`${buttonClasses({ variant, size })} ${className}`}
      {...props}
    />
  )
}
