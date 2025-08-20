import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Zap, Shield, Layers, Users } from "lucide-react"
import { Link } from "react-router-dom"
import heroImage from "@/assets/hero-image.jpg"
import FramePicker from "@/components/FramePicker"

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-sticky">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Studio</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <Link to="/studio">
              <Button variant="default" size="sm">
                Go to Studio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                  Build Amazing
                  <span className="block bg-gradient-primary bg-clip-text text-transparent">
                    Digital Experiences
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Professional tools and components designed for modern development teams. 
                  Create beautiful, accessible, and performant applications with ease.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/studio">
                  <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Documentation
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-3xl opacity-20"></div>
              <img
                src={heroImage}
                alt="Hero illustration showing modern design tools and components"
                className="relative rounded-2xl shadow-xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Frame Picker Section */}
      <FramePicker />

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build modern applications with confidence and speed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card variant="elevated" className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 h-12 w-12 bg-primary-light rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Optimized for performance with tree-shaking and code-splitting built-in.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card variant="elevated" className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 h-12 w-12 bg-accent-light rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Secure by Default</CardTitle>
                <CardDescription>
                  Built with security best practices and comprehensive accessibility support.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card variant="elevated" className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 h-12 w-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Team Friendly</CardTitle>
                <CardDescription>
                  Modular architecture that scales with your team and project requirements.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <Card variant="ghost" className="bg-gradient-primary text-primary-foreground">
            <CardContent className="py-16 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Start Building?
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Join thousands of developers who are already using our platform to create amazing experiences.
              </p>
              <Link to="/studio">
                <Button variant="secondary" size="lg">
                  Launch Studio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-gradient-primary rounded-md flex items-center justify-center">
                  <Layers className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">Studio</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional development tools for modern teams.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Examples</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Studio. Built with modern architecture principles.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Index