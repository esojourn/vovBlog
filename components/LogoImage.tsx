'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function LogoImage() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 根据主题选择 logo
  const logoSrc = theme === 'dark' ? '/images/Logo-light.png' : '/images/Logo-dark.png';
  const altText = theme === 'dark' ? 'VovBlog Logo Light' : 'VovBlog Logo Dark';

  // 防止 hydration 不匹配，未挂载时显示默认 logo
  const displaySrc = mounted ? logoSrc : '/images/Logo-dark.png';
  const displayAlt = mounted ? altText : 'VovBlog Logo';

  return (
    <Link href="/" className="hover:opacity-80 transition-opacity">
      <Image
        src={displaySrc}
        alt={displayAlt}
        width={192}
        height={192}
        priority
        className="h-48 w-auto"
      />
    </Link>
  );
}
