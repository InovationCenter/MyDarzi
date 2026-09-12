import React from 'react';
import Svg, { Circle, Path, Rect, type SvgProps } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
} & Omit<SvgProps, 'width' | 'height' | 'color'>;

function base({ size = 24, color = '#0F766E', strokeWidth = 1.8, ...rest }: IconProps) {
  return { size, color, strokeWidth, rest };
}

export function HomeIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.5v-6h-3v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CustomersIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M3.5 19c.8-3 2.9-4.5 5.5-4.5S13.7 16 14.5 19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="17" cy="9" r="2.4" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M15.2 19c.4-1.8 1.5-3 3.3-3 1.2 0 2.1.5 2.7 1.4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function OrdersIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M8 4h8l1.5 3H6.5L8 4Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M6.5 7h11v11.5a1.5 1.5 0 0 1-1.5 1.5h-8a1.5 1.5 0 0 1-1.5-1.5V7Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path d="M10 11h4M10 15h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function MoreIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Circle cx="6" cy="12" r="1.6" fill={color} />
      <Circle cx="12" cy="12" r="1.6" fill={color} />
      <Circle cx="18" cy="12" r="1.6" fill={color} />
      <Path d="M0 0h24v24H0z" fill="none" strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth={strokeWidth} />
      <Path d="m16.5 16.5 4 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CameraIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.1-1.5h6.4L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="3.2" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function PhoneIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M7.5 3.8c.5-.5 1.3-.5 1.7.1l1.5 2.2c.4.5.3 1.2-.2 1.6l-1.2 1c1.3 2.4 3.1 4.2 5.5 5.5l1-1.2c.4-.5 1.1-.6 1.6-.2l2.2 1.5c.6.4.6 1.2.1 1.7l-1.1 1.1c-.5.5-1.2.7-1.9.5-3.4-.9-6.5-3.1-8.9-5.5-2.4-2.4-4.6-5.5-5.5-8.9-.2-.7 0-1.4.5-1.9l1.1-1.1Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L4 20.5l4.4-.7A8.5 8.5 0 1 0 12 3.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M9.2 9.4c.3-.3.7-.3.9 0l.9 1.2c.2.3.1.6-.1.8l-.5.5c.8 1.4 1.9 2.4 3.3 3.1l.5-.5c.2-.2.5-.3.8-.1l1.2.9c.3.2.3.6 0 .9l-.6.6c-.3.3-.7.4-1.1.3-1.9-.5-3.7-1.7-5.1-3.1-1.4-1.4-2.6-3.2-3.1-5.1-.1-.4 0-.8.3-1.1l.6-.6Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RulerIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M4.5 15.5 15.5 4.5 19.5 8.5 8.5 19.5 4.5 15.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="m8 12 .8.8M10.2 9.8l.8.8M12.4 7.6l.8.8M7 15l.8.8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SpeakerIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M4.5 9.5h3L12 6v12l-4.5-3.5h-3v-5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 9.5a3.5 3.5 0 0 1 0 5M17.8 7.2a6.5 6.5 0 0 1 0 9.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MoneyIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Rect
        x="3.5"
        y="6"
        width="17"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Circle cx="12" cy="12" r="2.6" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M6.5 9.5v5M17.5 9.5v5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function TagIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M3.8 12.2 11.5 4.5h6.2A1.8 1.8 0 0 1 19.5 6.3v6.2L11.8 20.2a1.4 1.4 0 0 1-2 0L3.8 14.2a1.4 1.4 0 0 1 0-2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Circle cx="15.2" cy="8.8" r="1.2" fill={color} />
    </Svg>
  );
}

export function InventoryIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M4.5 8.5 12 4.5l7.5 4V16L12 20l-7.5-4V8.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path d="M12 12v8M4.5 8.5 12 12l7.5-3.5" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

export function StaffIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Circle cx="12" cy="8" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M5.5 19c1-3.2 3.3-5 6.5-5s5.5 1.8 6.5 5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path d="M16.5 5.5 18 4l1.5 1.5L18 7l-1.5-1.5Z" fill={color} />
    </Svg>
  );
}

export function BusinessIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M4 20V9.5L12 4l8 5.5V20H4Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path d="M10 20v-5h4v5" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M8 11h1.5M14.5 11H16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ChartIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path d="M4 19h16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M7 16V11M12 16V8M17 16V5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="m5.5 12.5 4.2 4.2L18.5 7.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path d="m7 7 10 10M17 7 7 17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function EditIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="m14.2 5.8 4 4L8.5 19.5H4.5v-4L14.2 5.8Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path d="m12.5 7.5 4 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path d="M5 7h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path
        d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M7.5 7 8.3 19a1.5 1.5 0 0 0 1.5 1.4h4.4a1.5 1.5 0 0 0 1.5-1.4L16.5 7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function NeedleIcon(props: IconProps) {
  const { size, color, strokeWidth, rest } = base(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M6 18.5 16.5 5.5c.8-.9 2.2-.8 2.9.2.6.9.3 2.1-.6 2.7L7.5 18.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M5.5 19c2.5-1 4.5.2 4.5 2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="18.2" cy="5.8" r="1.1" fill={color} />
    </Svg>
  );
}

export type AppIconName =
  | 'home'
  | 'customers'
  | 'orders'
  | 'more'
  | 'search'
  | 'plus'
  | 'camera'
  | 'phone'
  | 'whatsapp'
  | 'ruler'
  | 'speaker'
  | 'money'
  | 'tag'
  | 'inventory'
  | 'staff'
  | 'business'
  | 'chart'
  | 'check'
  | 'close'
  | 'edit'
  | 'trash'
  | 'needle';

const ICON_MAP = {
  home: HomeIcon,
  customers: CustomersIcon,
  orders: OrdersIcon,
  more: MoreIcon,
  search: SearchIcon,
  plus: PlusIcon,
  camera: CameraIcon,
  phone: PhoneIcon,
  whatsapp: WhatsAppIcon,
  ruler: RulerIcon,
  speaker: SpeakerIcon,
  money: MoneyIcon,
  tag: TagIcon,
  inventory: InventoryIcon,
  staff: StaffIcon,
  business: BusinessIcon,
  chart: ChartIcon,
  check: CheckIcon,
  close: CloseIcon,
  edit: EditIcon,
  trash: TrashIcon,
  needle: NeedleIcon,
} as const;

export function AppIcon({
  name,
  ...props
}: IconProps & { name: AppIconName }) {
  const Cmp = ICON_MAP[name];
  return <Cmp {...props} />;
}
