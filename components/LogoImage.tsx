'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export function LogoImage() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 根据主题选择 logo
  const isDark = theme === 'dark';
  const logoSrc = isDark ? '/images/Logo-light.png' : '/images/Logo-dark.png';
  const altText = isDark ? 'VovBlog Logo Light' : 'VovBlog Logo Dark';

  // 防止 hydration 不匹配，未挂载时显示默认 logo
  const displaySrc = mounted ? logoSrc : '/images/Logo-dark.png';
  const displayAlt = mounted ? altText : 'VovBlog Logo';

  return (
    <Link href="/" className="hover:opacity-80 transition-opacity">
      <img
        key={displaySrc}
        src={displaySrc}
        alt={displayAlt}
        className="h-16 sm:h-20 md:h-24 lg:h-32 w-auto"
        style={{ display: mounted ? 'block' : 'none' }}
      />
    </Link>
  );
}
