import { motion, type Variants } from "framer-motion";
import { BsTwitterX, BsYoutube } from "react-icons/bs";
import { FaTiktok } from "react-icons/fa";
import { IoLogoInstagram } from "react-icons/io5";
import { TbBrandLinkedinFilled } from "react-icons/tb";
import NavBar from "../components/landingPage/nav_bar";
import Footer from "../components/landingPage/footer";
import { useState } from "react";
import emailjs from "emailjs-com";

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

interface FormData {
  name: string;
  email: string;
  message: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export default function ContactUsPage() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [_, setSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    emailjs
      .send(
        serviceId, // replace with your EmailJS service ID
        templateId, // replace with your template ID
        {
          name: form.name,
          email: form.email,
          message: form.message,
        },
        publicKey, // replace with your public key
      )
      .then(
        (response) => {
          console.log("SUCCESS!", response.status, response.text);
          setSuccess("Email sent successfully!");
          setForm({ name: "", email: "", message: "" });
          setLoading(false);
        },
        (err) => {
          console.error("FAILED...", err);
          setSuccess("Failed to send email.");
          setLoading(false);
        },
      );
  };
  const socialIcons = [
    { Icon: TbBrandLinkedinFilled, link: "#" },
    { Icon: BsYoutube, link: "#" },
    { Icon: IoLogoInstagram, link: "#" },
    { Icon: BsTwitterX, link: "#" },
    { Icon: FaTiktok, link: "#" },
  ];

  return (
    <div className="w-full min-h-screen flex flex-col bg-white overflow-x-hidden">
      <div className="py-5 px-6 md:px-10">
        <NavBar />
      </div>

      <main className="grow bg-black flex justify-center items-center py-12 px-4 md:px-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="bg-white rounded-4xl shadow-2xl flex flex-col lg:flex-row w-full max-w-5xl overflow-hidden"
        >
          {/* LEFT SIDE: Contact Info */}
          <div className="bg-gray-50 p-10 lg:w-2/5 flex flex-col justify-between">
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold mb-8">Get in touch</h2>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-1">
                    Email
                  </p>
                  <p className="text-lg font-medium">hodrachq@gmail.com</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-1">
                    Phone
                  </p>
                  <p className="text-lg font-medium">+1 647 281 0613</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-12 lg:mt-0">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                Follow Us
              </p>
              <div className="flex gap-4">
                {socialIcons.map(({ Icon, link }, index) => (
                  <motion.a
                    key={index}
                    href={link}
                    whileHover={{ y: -3, scale: 1.1 }}
                    className="p-3 text-purple-600! bg-white border border-gray-200 rounded-full text-xl hover:text-black! hover:border-purple-200 transition-all shadow-sm"
                  >
                    <Icon />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT SIDE: Form */}
          <div className="p-10 lg:w-3/5">
            <form
              className="flex flex-col h-full space-y-6"
              onSubmit={handleSubmit}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-600">
                    Full Name
                  </label>
                  <input
                    className="border border-gray-200 h-12 p-4 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                    type="text"
                    placeholder="John Doe"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-600">
                    Email Address
                  </label>
                  <input
                    className="border border-gray-200 h-12 p-4 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                    type="email"
                    placeholder="john@example.com"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 grow">
                <label className="text-sm font-semibold text-gray-600">
                  Message
                </label>
                <textarea
                  className="border border-gray-200 min-h-37.5 p-4 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none transition-all resize-none"
                  placeholder="Tell us how we can help..."
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 transition-all"
              >
                {loading ? "Sending..." : "Send Message"}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
