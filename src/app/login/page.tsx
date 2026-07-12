import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const error = typeof resolvedParams.error === 'string' ? resolvedParams.error : undefined

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm shadow-2xl border-none bg-card/80 backdrop-blur-xl">
        <form>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Welcome</CardTitle>
            <CardDescription>Sign in to your family budget workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" formAction={login} className="w-full">Sign In</Button>
            <Button type="submit" formAction={signup} variant="outline" className="w-full">Create Account</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
