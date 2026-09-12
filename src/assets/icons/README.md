# App icons (SVG)

Source SVG files live in `src/assets/icons/`.

React Native components (via `react-native-svg`) live in `src/shared/icons/`.

## Usage

```tsx
import { AppIcon, HomeIcon } from '../../shared/icons';

<AppIcon name="home" size={24} color="#0F766E" />
<HomeIcon size={20} color={colors.primary} />
```

## Available icons

| Name | File | Used for |
|------|------|----------|
| `home` | home.svg | Home tab |
| `customers` | customers.svg | Customers tab |
| `orders` | orders.svg | Orders tab |
| `more` | more.svg | More tab |
| `search` | search.svg | Search |
| `plus` | plus.svg | Add actions |
| `camera` | camera.svg | Photos |
| `phone` | phone.svg | Phone |
| `whatsapp` | whatsapp.svg | WhatsApp |
| `ruler` | ruler.svg | Measurements / templates |
| `speaker` | speaker.svg | Text-to-speech |
| `money` | money.svg | Payments |
| `tag` | tag.svg | Garment prices |
| `inventory` | inventory.svg | Inventory |
| `staff` | staff.svg | Staff |
| `business` | business.svg | Business profile |
| `chart` | chart.svg | Reports |
| `check` | check.svg | Confirm |
| `close` | close.svg | Cancel |
| `edit` | edit.svg | Edit |
| `trash` | trash.svg | Delete |
| `needle` | needle.svg | Brand / tailor mark |

Default stroke color is brand teal `#0F766E`.
