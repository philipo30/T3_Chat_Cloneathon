import React from 'react'
import {
  Folder,
  FolderOpen,
  FileText,
  Archive,
  Bookmark,
  Tag,
  Star,
  Heart,
  Layers,
  Grid3X3,
  Briefcase,
  Home,
  Building2,
  Package,
  Zap,
  Target,
  Trophy,
  Palette,
  Code,
  Database
} from 'lucide-react'

// Icon mapping for workspace icons
export const WORKSPACE_ICON_MAP = {
  folder: Folder,
  briefcase: Briefcase,
  home: Home,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  tag: Tag,
  archive: Archive,
  layers: Layers,
  grid: Grid3X3,
  building: Building2,
  package: Package,
  zap: Zap,
  target: Target,
  trophy: Trophy,
  palette: Palette,
  code: Code,
  database: Database,
} as const

// Icon mapping for folder icons
export const FOLDER_ICON_MAP = {
  folder: Folder,
  'folder-open': FolderOpen,
  'file-text': FileText,
  archive: Archive,
  bookmark: Bookmark,
  tag: Tag,
  star: Star,
  heart: Heart,
  layers: Layers,
  grid: Grid3X3,
  package: Package,
  code: Code,
  database: Database,
  target: Target,
  trophy: Trophy,
} as const

// Type definitions
export type WorkspaceIconName = keyof typeof WORKSPACE_ICON_MAP
export type FolderIconName = keyof typeof FOLDER_ICON_MAP

// Component to render workspace icons
export const WorkspaceIcon: React.FC<{
  iconName: string
  className?: string
  style?: React.CSSProperties
}> = ({ iconName, className = 'w-4 h-4', style }) => {
  const IconComponent = WORKSPACE_ICON_MAP[iconName as WorkspaceIconName] || Folder
  return <IconComponent className={className} style={style} />
}

// Component to render folder icons
export const FolderIcon: React.FC<{
  iconName: string
  className?: string
  style?: React.CSSProperties
}> = ({ iconName, className = 'w-4 h-4', style }) => {
  const IconComponent = FOLDER_ICON_MAP[iconName as FolderIconName] || Folder
  return <IconComponent className={className} style={style} />
}

// Helper function to get workspace icon component
export const getWorkspaceIconComponent = (iconName: string) => {
  return WORKSPACE_ICON_MAP[iconName as WorkspaceIconName] || Folder
}

// Helper function to get folder icon component
export const getFolderIconComponent = (iconName: string) => {
  return FOLDER_ICON_MAP[iconName as FolderIconName] || Folder
}
