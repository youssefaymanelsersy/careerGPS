import { ModeToggle } from '@/components/composites/mode-toggle'
import UserMenu from '@/components/composites/user-menu'
import { Link } from 'react-router'

function Header() {
  return (
    <header className="flex justify-between items-center flex-wrap h-(--header-height)">
            <Link to="/" className="text-2xl">CareerGPS</Link>
            <div className="flex justify-center items-center gap-2">
              <ModeToggle/>
              <UserMenu/>
            </div>
          </header>
  )
}

export default Header