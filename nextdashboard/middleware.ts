export { auth as middleware } from "@/auth"

//export default NextAuth(authConfig).auth;

/*export default auth((req) => {
  console.log("???")
  // req.auth
})*/

export const config = {
  matcher: ['/((?!api|bot|_next/static|_next/image|.*\\.png|ico|webp$).*)'],
};