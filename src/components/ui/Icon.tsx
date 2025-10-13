import React from 'react'
/* import Image from 'next/image'

export type IconName =
  | 'magnifying-glass-search'
  | 'funnel-filter'
  | 'trash_garbage_can'
  | 'circle-check'
  | 'external_link'
  | 'folder_drawer_category'
  | 'calendar-check'
  | 'envelope-closed-email'
  | 'people-group'
  | 'location-pin'
  | 'map'
  | 'key'
  | 'table_chart'
  | 'up-arrow-line-chart'
  | 'bar_code_sku'
  | 'dollars-bills-money-stack'
  | 'retail-price-tag'
  | 'watch-time-wrist-clock'
  | 'bookmark'
  | 'toggle_on_off'
  | 'ticket-event-stub'
  | 'palette_paint_creative'
  | 'shopping-bag-purse'
  | 'target_bullseye'
  | 'pencil-edit'
  | 'chevron-down'
  | 'chevron-up'

export interface IconProps extends Omit<React.HTMLAttributes<HTMLImageElement>, 'src'> {
  name: IconName
  size?: number | string
  color?: string
  'aria-label'?: string
}

/**
 * Icon Component
 *
 * Renders SVG icons from the /public/icons/ directory
 * All icons are in Morning Blue (#1C7FF2) by default
 *
 * @example
 * <Icon name="magnifying-glass-search" size={20} aria-label="Search" />
 * <Icon name="trash_garbage_can" size={16} />
 */
export function Icon({
  name,
  size = 20,
  color,
  className = '',
  'aria-label': ariaLabel,
  ...props
}: IconProps) {
  const iconPath = `/icons/${name}.svg`
  const numericSize = typeof size === 'number' ? size : parseInt(size as string, 10)

  return (
    <img
      src={iconPath}
      alt={ariaLabel || ''}
      aria-hidden={!ariaLabel}
      width={numericSize}
      height={numericSize}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        filter: color ? undefined : undefined, // Can add filter for color override if needed
        ...props.style,
      }}
      {...props}
    />
  )
}

Icon.displayName = 'Icon'
