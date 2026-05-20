import Footer from '@/features/marketing/components/footer'
import Header from '@/features/marketing/components/header'
import { Outlet } from 'react-router'

function MarketingLayout() {
  return (
    <>
      <main className="container mx-auto max-w-7xl px-4 [--header-height:3.5rem]">
        <Header/>
        <Outlet/>
      </main>
      <Footer/>
    </>
  )
}

export default MarketingLayout