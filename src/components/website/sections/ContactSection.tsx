import { useState } from "react";
import { MapPin, Phone, Mail, Clock, CheckCircle, Facebook, Twitter, Linkedin, SendMail } from "iconoir-react";
import ScrollReveal from "@/components/website/ScrollReveal";

const inputClass =
  "bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3 text-white placeholder-white/25 focus:border-primary/60 focus:outline-none focus:ring-0 text-sm w-full transition-colors duration-200";

const labelClass = "block text-white/70 text-sm mb-2";

interface ContactInfo {
  icon: React.ElementType;
  label: string;
  value: string;
}

const contactItems: ContactInfo[] = [
  { icon: MapPin, label: "Location", value: "Kabul, Afghanistan" },
  { icon: Phone, label: "Phone", value: "+93 (0) 700 000 000" },
  { icon: Mail, label: "Email", value: "info@raad.af" },
  { icon: Clock, label: "Hours", value: "Mon–Fri: 8:00 AM – 6:00 PM" },
];

const subjectOptions = [
  "Program Inquiry",
  "Campus Visit",
  "ACCA Information",
  "CMA Information",
  "General Inquiry",
];

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const ContactSection = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="bg-[#050a18] py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ── Left: Contact Info ── */}
          <ScrollReveal delay={0}>
            <div className="flex h-full flex-col">
              <span className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                Get in Touch
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                Let's Talk About Your Future
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/55">
                Whether you have questions about our programs, need guidance on which
                qualification to pursue, or want to visit our campus — we're here to
                help.
              </p>

              {/* Info items */}
              <ul className="mt-8 flex flex-col gap-5">
                {contactItems.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                        {label}
                      </p>
                      <p className="text-sm font-medium text-white/85">{value}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Social row */}
              <div className="mt-10 flex items-center gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] text-white/60 transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] text-white/60 transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] text-white/60 transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* ── Right: Contact Form ── */}
          <ScrollReveal delay={0.1}>
            {submitted ? (
              /* Success state */
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-success/25 bg-success/5 px-8 py-14 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle className="h-8 w-8" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-white">
                  Message Sent!
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
                  Thank you for reaching out. Our team will get back to you
                  within 1–2 business days.
                </p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setForm(initialForm); }}
                  className="mt-6 rounded-full border border-white/[0.15] bg-white/[0.05] px-6 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.10] hover:text-white"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8"
              >
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className={labelClass}>
                    Full Name <span className="text-primary">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Ahmad Karimi"
                    value={form.fullName}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email Address <span className="text-primary">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                {/* Phone (optional) */}
                <div>
                  <label htmlFor="phone" className={labelClass}>
                    Phone{" "}
                    <span className="text-white/35 text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+93 700 000 000"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className={labelClass}>
                    Subject <span className="text-primary">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="" disabled>
                      Select a subject…
                    </option>
                    {subjectOptions.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#0c1422] text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className={labelClass}>
                    Message <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="Tell us how we can help…"
                    value={form.message}
                    onChange={handleChange}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(0,105,180,0.35)] transition-all duration-200 hover:bg-primary-active hover:shadow-[0_6px_28px_rgba(0,105,180,0.45)]"
                >
                  <SendMail className="h-4 w-4" />
                  Send Message
                </button>
              </form>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
