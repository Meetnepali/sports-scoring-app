import Link from "next/link"
import { Trophy } from "lucide-react"

export function EnhancedFooter() {
  return (
    <footer className="border-t bg-muted/30 py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">Sports</p>
                <p className="text-2xl font-bold">Scoring</p>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              The best sports streaming and scoring platform of the century
            </p>
          </div>

          {/* Platform Column */}
          <div>
            <h3 className="font-bold mb-4">Platform</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/teams" className="hover:text-foreground transition-colors">
                  Teams
                </Link>
              </li>
              <li>
                <Link href="/matches" className="hover:text-foreground transition-colors">
                  Matches
                </Link>
              </li>
              <li>
                <Link href="/tournaments" className="hover:text-foreground transition-colors">
                  Tournaments
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-foreground transition-colors">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div>
            <h3 className="font-bold mb-4">Solutions</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/signup" className="hover:text-foreground transition-colors">
                  Start a Trial
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/examples" className="hover:text-foreground transition-colors">
                  Examples
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-foreground transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* About Us Column */}
          <div>
            <h3 className="font-bold mb-4">About Us</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/points" className="hover:text-foreground transition-colors">
                  Points
                </Link>
              </li>
              <li>
                <Link href="/partner" className="hover:text-foreground transition-colors">
                  Become Partner
                </Link>
              </li>
              <li>
                <Link href="/affiliate" className="hover:text-foreground transition-colors">
                  Affiliate Program
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            Copyright © 2025 Powered by Sports Scoring. All rights reserved
          </p>
          
          <div className="flex items-center gap-6">
            <Link 
              href="https://twitter.com" 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Twitter
            </Link>
            <Link 
              href="https://facebook.com" 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Facebook
            </Link>
            <Link 
              href="https://instagram.com" 
              target="_blank"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Instagram
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
