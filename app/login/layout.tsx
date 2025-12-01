// Login layout - không redirect ở đây để tránh loop
// Middleware sẽ xử lý redirect nếu user đã đăng nhập
export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Không check user ở đây để tránh redirect loop
  // Middleware sẽ xử lý việc block/redirect nếu đã đăng nhập
  return <>{children}</>
}
