import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/shared/Logo';
import SEO from '@/components/shared/SEO';
import { User, Mail, Building, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';

const Enquire = () => {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan');

  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/public/enquiries', {
        companyName,
        firstName,
        lastName,
        email,
        phone,
        // Fold the pricing plan the enquiry started from (if any) into the
        // message so whoever reviews it in the Super Admin panel has that
        // context, rather than needing a separate field for it.
        message: plan ? `${message}${message ? '\n\n' : ''}Interested plan: ${plan}` : message
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const parsedError = err as { response?: { data?: { message?: string } } };
      setError(parsedError.response?.data?.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] font-poppins! lg:min-h-screen grid lg:grid-cols-2 bg-[#F9FAEF] lg:p-0 gap-6">
      <SEO
        title="Enquire"
        description="Tell us about your team and we'll get back to you to set up your Pype CRM account."
      />
      {/* Visual Section — brand-green panel, matches Login/Enquire styling */}
      <div className="hidden lg:flex relative h-full overflow-hidden rounded-[0px] bg-gradient-to-br from-[hsl(var(--chart-5))] to-[hsl(94_48%_34%)] flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-16 h-16 rounded-2xl bg-white/10 rotate-12" />
          <div className="absolute top-24 left-32 w-10 h-10 rounded-xl bg-white/10 -rotate-6" />
          <div className="absolute top-16 right-16 w-8 h-8 rounded-lg bg-white/10 rotate-45" />
          <div className="absolute bottom-40 right-10 w-20 h-20 rounded-2xl bg-white/10 rotate-12" />
          <div className="absolute bottom-24 left-8 w-24 h-24 rounded-3xl bg-white/10 -rotate-12" />
          <div className="absolute bottom-56 left-24 w-9 h-9 rounded-lg bg-white/10 rotate-6" />
          <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 500 700" fill="none" preserveAspectRatio="none">
            <path d="M40 60 C 200 140, 120 260, 320 220 S 420 420, 250 480 S 60 600, 180 660" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative z-10">
          <Logo size="md" showText variant="onColor" />
        </div>

        <div className="relative z-10 space-y-3 max-w-md">
          <p className="text-[13px] ml-0.5 font-poppins font-semibold tracking-[0.2em] uppercase text-white/70">
            Sales &bull; Automation &bull; Growth
          </p>
          <h2 className="text-5xl font-poppins! font-semibold! text-white tracking-tight leading-[1.1]">
            Let's Talk<br />
            About Your<br />
            <span className="text-white/80">Sales Team.</span>
          </h2>
          <p className="text-white ml-0.5 font-poppins text-[15px] leading-relaxed max-w-[20rem]">
            Tell us a bit about your company and we'll reach out to set up your Pype CRM account.
          </p>
          <div className="w-10 ml-1 h-px bg-white/40" />
          <p className="text-[13px] ml-0.5 font-poppins font-semibold tracking-[0.2em] uppercase text-white">
            Organize &bull; Automate &bull; Grow
          </p>
        </div>

        <div className="relative font-poppins z-10 text-xs text-white">
          © 2026 Pype CRM. All rights reserved.
        </div>
      </div>

      {/* Form Section */}
      <div className="flex min-h-[100dvh] lg:min-h-full items-center justify-center px-4 py-6 lg:p-12">
        <Card className="w-full max-w-[460px] border border-[#79bc46]/40 bg-white rounded-[12px]!">
          {submitted ? (
            <CardContent className="px-8 py-14 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-[hsl(var(--chart-5))]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-[hsl(var(--chart-5))]" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Thanks for reaching out!</CardTitle>
              <p className="text-sm text-muted-foreground max-w-[320px] mx-auto">
                We've received your enquiry. Our team will review it and get back to you shortly to set up your account.
              </p>
              <a href="/" className="inline-block text-sm font-medium text-[hsl(var(--chart-5))] hover:underline pt-2">
                Back to home
              </a>
            </CardContent>
          ) : (
            <>
              <CardHeader className="space-y-2 text-center px-8 pt-10">
                <div className="flex justify-center mb-2">
                  <Logo size="md" showText />
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight">
                  Enquire <span className="text-[hsl(var(--chart-5))]">Now</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tell us about your team and we'll be in touch
                </p>
              </CardHeader>
              <CardContent className="space-y-4 px-8 pb-10">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder="Acme Inc."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="border border-input bg-white pl-10 h-11 rounded-[10px] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#79bc46]/40 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          name="firstName"
                          autoComplete="given-name"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="border border-input bg-white pl-10 h-11 rounded-[10px] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#79bc46]/40 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          name="lastName"
                          autoComplete="family-name"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="border border-input bg-white pl-10 h-11 rounded-[10px] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#79bc46]/40 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border border-input bg-white pl-10 h-11 rounded-[10px] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#79bc46]/40 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="border border-input bg-white pl-10 h-11 rounded-[10px] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#79bc46]/40 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">What are you looking for? <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us a bit about your team and what you need..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="border border-input bg-white rounded-[10px] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#79bc46]/40 transition-colors resize-none"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button
                    className="w-full h-11 rounded-[10px] bg-[hsl(var(--chart-5))] text-white hover:bg-[hsl(94_48%_38%)] transition-all duration-300 gap-2 font-semibold"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Submitting...' : (
                      <>
                        Submit Enquiry
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground pt-1">
                    Already have an account?{' '}
                    <a href="/login" className="font-medium text-[hsl(var(--chart-5))] hover:underline">
                      Sign in
                    </a>
                  </p>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Enquire;
