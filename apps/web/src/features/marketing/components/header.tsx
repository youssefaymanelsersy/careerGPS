import { useState, useEffect } from 'react'
import { ModeToggle } from '@/components/composites/mode-toggle'
import UserMenu from '@/components/composites/user-menu'
import { Link } from 'react-router'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import Logo from '@/components/ui/logo'
import { cn } from '@/lib/utils'

function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 flex justify-between items-center flex-wrap uppercase h-(--header-height) px-6 transition-colors duration-300',
        isScrolled
          ? 'bg-background/80 backdrop-blur-sm border-b border-border'
          : 'bg-transparent'
      )}
    >
      <Link to="/"><Logo /></Link>
      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink render={<Link to="/#how-it-works" />}>
              How it works
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink render={<Link to="/#features" />}>
              Features
            </NavigationMenuLink>
          </NavigationMenuItem>
          {/* <NavigationMenuItem>
            <NavigationMenuLink render={<Link to="/#pricing" />}>
              Pricing
            </NavigationMenuLink>
          </NavigationMenuItem> */}
          <NavigationMenuItem>
            <NavigationMenuLink render={<Link to="/#faq" />}>
              Faq
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex justify-center items-center gap-2">
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  )
}

export default Header
