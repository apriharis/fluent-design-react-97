import { Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Shield, Layers, Users } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Footer } from "@/components/layout/Footer";

// Lazy load FramePicker for better initial loading
const FramePicker = lazy(() => import("@/components/FramePicker"));

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-sticky">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold">Studio</span>
          </div>
          <nav className="flex items-center gap-3 sm:gap-6">
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Features
              </a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                About
              </a>
            </div>
            <ThemeToggle />
            <Link to="/studio">
              <Button variant="default" size="sm">
                <span className="hidden sm:inline">Go to Studio</span>
                <span className="sm:hidden">Studio</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section - Compact on mobile */}
      <section className="py-12 sm:py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight">
                  Create Amazing
                  <span className="block bg-gradient-primary bg-clip-text text-transparent">
                    Photo Frames
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
                  Professional photo framing tools designed for everyone. 
                  Create beautiful, custom framed photos with ease.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link to="/studio">
                  <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Examples
                </Button>
              </div>
            </div>
            <div className="relative order-first lg:order-last">
              <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-3xl opacity-20"></div>
              <img
                src={heroImage}
                alt="Professional photo framing showcase"
                className="relative rounded-2xl shadow-xl w-full h-auto object-cover max-h-[400px] sm:max-h-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Frame Picker Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Choose Your Frame</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Start creating your perfect photo frame right away
            </p>
          </div>
          <Suspense fallback={<LoadingSkeleton variant="frame-picker" />}>
            <FramePicker />
          </Suspense>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3 sm:space-y-4 mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Powerful Features</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create professional photo frames with ease
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card variant="elevated" className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 h-12 w-12 bg-primary-light rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Instant photo processing with real-time preview and adjustments
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card variant="elevated" className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 h-12 w-12 bg-accent-light rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Privacy First</CardTitle>
                <CardDescription>
                  All processing happens locally in your browser - your photos never leave your device
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card variant="elevated" className="text-center sm:col-span-2 lg:col-span-1">
              <CardHeader>
                <div className="mx-auto mb-4 h-12 w-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Easy to Use</CardTitle>
                <CardDescription>
                  Intuitive interface designed for everyone, from beginners to professionals
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <Card variant="ghost" className="bg-gradient-primary text-primary-foreground">
            <CardContent className="py-12 sm:py-16 text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                Ready to Start Creating?
              </h2>
              <p className="text-lg sm:text-xl text-primary-foreground/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Join thousands of users who are already creating beautiful framed photos
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

      <Footer />
    </div>
  );
};

export default Index;