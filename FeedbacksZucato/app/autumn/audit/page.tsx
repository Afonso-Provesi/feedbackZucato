import dynamic from 'next/dynamic'
const DashboardPage = dynamic(() => import('../../admin/dashboard/page'), { ssr: false })
export default DashboardPage
