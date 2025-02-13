export { auth as middleware } from "@/auth"

//export default NextAuth(authConfig).auth;
 
/*export default auth((req) => {
  console.log("???")
  // req.auth
})*/

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png|ico|webp$).*)'],
};