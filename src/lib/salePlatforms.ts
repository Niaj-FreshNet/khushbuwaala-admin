import { Globe, MessageCircle, MoreHorizontal, Phone, Store, Users } from 'lucide-react';

/** Where an admin sale came from (Order.platform; SHOWROOM also sets orderSource SHOWROOM). */
export const PLATFORMS = [
  { value: 'SHOWROOM', label: 'Showroom', full: 'Showroom', icon: Store },
  { value: 'FACEBOOK_PAGE', label: 'Page', full: 'Facebook Page', icon: Globe },
  { value: 'WHATSAPP', label: 'WhatsApp', full: 'WhatsApp', icon: MessageCircle },
  { value: 'FACEBOOK_GROUP', label: 'Group', full: 'Facebook Group', icon: Users },
  { value: 'PHONE_CALL', label: 'Call', full: 'Phone Call', icon: Phone },
  { value: 'OTHER', label: 'Other', full: 'Other', icon: MoreHorizontal },
] as const;

export type PlatformValue = (typeof PLATFORMS)[number]['value'];
