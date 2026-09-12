from pathlib import Path
import re

for path in [
    'src/features/dashboard/DashboardScreen.tsx',
    'src/features/settings/SettingsScreen.tsx',
    'src/features/auth/LoginScreen.tsx',
]:
    t = Path(path).read_text(encoding='utf-8')
    print('====', path, '====')
    print('shopName', 'shopName' in t, 'businessRepository', 'businessRepository' in t)
    for l in t.splitlines():
        if any(k in l for k in ['shopName', 'Title>', 'businessRepository', 'upsert', 'ownerName', 'FadeIn', 'ScreenFade', 'Brand', 'useFocusEffect', 'Shop /']):
            print(l)

no = Path('src/features/orders/NewOrderScreen.tsx').read_text(encoding='utf-8')
print('placeholder', re.findall(r"markCode \?\? '([^']*)'", no))
print('join', re.findall(r"join\('([^']*)'\)", no))
