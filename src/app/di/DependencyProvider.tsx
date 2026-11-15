import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { createContainer, type Container } from './container'

const DependencyContext = createContext<Container | null>(null)

interface Props {
  children: ReactNode
  container?: Container
}

export function DependencyProvider({ children, container }: Props) {
  const value = useMemo(() => container ?? createContainer(), [container])

  return <DependencyContext.Provider value={value}>{children}</DependencyContext.Provider>
}

export function useDependencies(): Container {
  const context = useContext(DependencyContext)
  if (!context) throw new Error('useDependencies deve ser usado dentro de <DependencyProvider>')
  return context
}