import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import AiModal from '../components/AiModal'; // Assuming AiModal is in this path
import { useSessionId } from '../hooks/useSessionId'; // Assuming useSessionId is in this path
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaBars, FaTimes } from "react-icons/fa";
import {
  BeakerIcon,
  UserGroupIcon,
  ClockIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  PhoneIcon,
  ChevronRightIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/solid";

// Animation variants for consistency
const fadeInStagger = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const fadeInItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const OliveHome = () => {
  // --- STATE MANAGEMENT ---
  // State from oldHome.jsx for AI Modal and Navigation
  const sessionId = useSessionId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('sq'); // Default to Albanian as per new content
  const [showNotification, setShowNotification] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // State from Ballina.jsx for UI components
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // --- DATA FOR OLIVE MEDICAL CENTER ---
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=2070",
      title: "Mirë se vini në Olive Medical",
      description: "Përkushtim dhe Ekselencë në Kujdesin Shëndetësor.",
    },
    {
      image: "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?auto=format&fit=crop&q=80&w=2070",
      title: "Teknologji e Avancuar",
      description: "Diagnostikim i saktë me pajisjet më moderne në rajon.",
    },
    {
      image: "https://images.unsplash.com/photo-1576091160550-2173dba9996a?auto=format&fit=crop&q=80&w=2070",
      title: "Staf Profesional dhe i Përkushtuar",
      description: "Mjekë me eksperiencë të gjatë klinike në shërbimin tuaj.",
    },
  ];

  const features = [
    {
      icon: <BeakerIcon className="h-8 w-8 text-white" />,
      title: "Laborator i Pajisur",
      description: "Pajisje të avancuara diagnostike me teknologji të reja nga vendet më të përparuara botërore.",
    },
    {
      icon: <UserGroupIcon className="h-8 w-8 text-white" />,
      title: "Staf i Specializuar",
      description: "Ekipi ynë përbëhet nga mjekë me certifikime ndërkombëtare dhe përvojë të gjatë.",
    },
    {
      icon: <ClockIcon className="h-8 w-8 text-white" />,
      title: "Rezultate të Shpejta",
      description: "Ofrojmë rezultate të shpejta pa kompromis për saktësinë, me procese të standardizuara.",
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8 text-white" />,
      title: "Ambient Steril dhe i Sigurt",
      description: "Kushte higjienike të kontrolluara rreptësisht sipas standardeve ndërkombëtare për sigurinë tuaj.",
    },
    {
      icon: <CreditCardIcon className="h-8 w-8 text-white" />,
      title: "Fleksibilitet Pagese",
      description: "Pranojmë shumicën e sigurimeve mjekësore dhe ofrojmë plane fleksibile pagese.",
    },
    {
      icon: <PhoneIcon className="h-8 w-8 text-white" />,
      title: "Ndihmë 24/7",
      description: "Shërbim emergjent gjatë gjithë orëve të ditës, me ekip të përkushtuar për urgjencat.",
    },
  ];

  const doctorQuote = {
    text: "Teknologjia më e avancuar është e pavlefshme pa profesionalizëm dhe përkushtim ndaj pacientit. Olive Medical kombinon të gjitha këto elemente në mënyrë të përsosur.",
    author: "Dr. Fatmir Berisha",
    credentials: "Kardiolog, Profesor në Universitetin e Mjekësisë",
  };

  const staffMembers = [
    { name: "Dr. Anisa Kadiqi", position: "Drejtore Laboratorike", photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800" },
    { name: "Dr. Endrit Leka", position: "Kryebiokimist", photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800" },
    { name: "Dr. Mirjeta Hoxha", position: "Specialiste Hematologe", photo: "https://images.unsplash.com/photo-1659353887907-000c9a92377d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { name: "Dr. Arben Shehu", position: "Patolog", photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=800" },
  ];
  
  const laboratoryNews = [
      { title: "Hapja e Departamentit të Ri Molekular", date: "15 Qershor 2024", summary: "Filloi punë sistemi i ri PCR me kapacitet të lartë, duke na bërë lider në rajon.", image: "https://images.unsplash.com/photo-1618498082410-b4aa22193b38?auto=format&fit=crop&q=80&w=800" },
      { title: "Certifikimi Ndërkombëtar ISO 15189:2022", date: "3 Mars 2024", summary: "Laboratori ynë merr certifikimin prestigjioz për menaxhimin e cilësisë.", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800" },
      { title: "Partneritet me Spitalin Universitar", date: "10 Janar 2024", summary: "Nënshkruam marrëveshje bashkëpunimi për kërkime klinike të avancuara.", image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800" },
  ];

  const navLinks = [
    { name: 'Ballina', href: '#' },
    { name: 'Shërbimet', href: '#services' },
    { name: 'Ekipi', href: '#staff' },
    { name: 'Kontakt', href: '#footer' },
  ];

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: FaFacebookF },
    { name: 'Instagram', href: '#', icon: FaInstagram },
    { name: 'LinkedIn', href: '#', icon: FaLinkedinIn }
  ];

  // --- EVENT HANDLERS ---
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setShowNotification(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // --- USEEFFECT HOOKS ---
  useEffect(() => {
    // Hero slider timing
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [slides.length]);

  useEffect(() => {
    // AI notification logic
    let notificationTimer;
    if (!isModalOpen) {
      notificationTimer = setTimeout(() => setShowNotification(true), 6000);
    } else {
      setShowNotification(false);
    }
    return () => clearTimeout(notificationTimer);
  }, [isModalOpen]);


  return (
    <div className="bg-slate-50 text-slate-800 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-slate-800/90 backdrop-blur-sm shadow-lg text-white border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="text-xl font-bold flex items-center space-x-2">
              <img src="/images/olive-logo.png" alt="Olive Medical Logo" className="h-8 w-auto" />
              <span className="text-white hidden md:block">Olive Medical</span>
            </a>
            <div className="hidden sm:flex items-center space-x-6">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="font-medium hover:text-emerald-300 transition-colors">
                  {link.name}
                </a>
              ))}
            </div>
            <div className="sm:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-slate-700 focus:outline-none">
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? <FaTimes className="block h-6 w-6" /> : <FaBars className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        <div className={`sm:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96' : 'max-h-0'} overflow-hidden`} id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-800 border-t border-slate-700">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-700">
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-screen text-white overflow-hidden">
        <AnimatePresence>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-end h-full pb-24 md:pb-32 text-center px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="max-w-4xl"
            >
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg">{slides[currentSlide].title}</h1>
              <p className="mt-4 text-lg md:text-xl text-slate-200 max-w-2xl mx-auto drop-shadow-md">{slides[currentSlide].description}</p>
            </motion.div>
          </AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="flex flex-wrap justify-center gap-4 mt-8">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-lg transform hover:scale-105">Lini një takim</button>
            <button className="bg-transparent border-2 border-white hover:bg-white hover:text-slate-900 text-white font-bold py-3 px-8 rounded-full transition-all duration-300">Shërbimet Tona</button>
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3">
          {slides.map((_, index) => (
            <button key={index} onClick={() => setCurrentSlide(index)} className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-white scale-125" : "bg-white/50"}`} aria-label={`Go to slide ${index + 1}`} />
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeInItem}>
            <h2 className="text-base font-semibold leading-7 text-emerald-600">PSE NE</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Gjithçka që ju nevojitet për shëndetin tuaj</p>
            <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">Ne kombinojmë teknologjinë më të fundit me një ekip të përkushtuar për t'ju ofruar shërbimin më të mirë të mundshëm.</p>
          </motion.div>
          <motion.div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeInStagger}>
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInItem} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-slate-900">
                  <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500">{feature.icon}</div>
                  {feature.title}
                </dt>
                <dd className="mt-2 text-base leading-7 text-slate-600">{feature.description}</dd>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Doctor's Quote Section */}
      <section className="py-24 bg-emerald-50">
        <motion.div className="max-w-4xl mx-auto px-6 lg:px-8" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeInItem}>
          <figure className="text-center">
            <blockquote className="text-xl md:text-2xl font-medium leading-9 text-slate-800"><p>"{doctorQuote.text}"</p></blockquote>
            <figcaption className="mt-8">
              <img className="w-20 h-20 mx-auto rounded-full" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400" alt="Dr. Fatmir Berisha" />
              <div className="mt-4 flex items-center justify-center space-x-3 text-base">
                <div className="font-semibold text-slate-900">{doctorQuote.author}</div>
                <svg viewBox="0 0 2 2" width={3} height={3} aria-hidden="true" className="fill-slate-900"><circle cx={1} cy={1} r={1} /></svg>
                <div className="text-slate-600">{doctorQuote.credentials}</div>
              </div>
            </figcaption>
          </figure>
        </motion.div>
      </section>

      {/* Staff Section */}
      <section id="staff" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeInItem}>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Njihuni me Ekipin Tonë</h2>
                <p className="mt-4 text-lg text-slate-600">Profesionistë të përkushtuar për shëndetin tuaj.</p>
            </motion.div>
            <motion.div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeInStagger}>
                {staffMembers.map((member, index) => (
                <motion.div key={index} variants={fadeInItem} className="text-center group">
                    <div className="relative w-48 h-48 mx-auto">
                    <img src={member.photo} alt={member.name} className="w-full h-full rounded-full object-cover shadow-lg transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-200 transition-all duration-500 group-hover:border-emerald-400 transform scale-105 group-hover:scale-110 opacity-0 group-hover:opacity-100" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-slate-900">{member.name}</h3>
                    <p className="text-emerald-600 font-medium">{member.position}</p>
                </motion.div>
                ))}
            </motion.div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-24 bg-slate-100">
        <motion.div className="max-w-4xl mx-auto px-6 lg:px-8 text-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeInItem}>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Eksperienca Olive Medical</h2>
            <p className="mt-4 text-lg text-slate-600">Shikoni një tur virtual të laboratorit dhe teknologjisë sonë të përparuar.</p>
            <div className="mt-10 relative aspect-video w-full rounded-xl overflow-hidden shadow-2xl cursor-pointer group">
                {!isVideoPlaying ? (
                <>
                    <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1470" alt="Video Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/60" onClick={() => setIsVideoPlaying(true)}>
                    <PlayCircleIcon className="w-24 h-24 text-white/80 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform transition-transform group-hover:scale-110" />
                    </div>
                </>
                ) : (
                <iframe className="w-full h-full" src="https://www.youtube.com/embed/SdpY-153h6s?autoplay=1&rel=0" title="Video prezantimi i Olive Medical" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                )}
            </div>
        </motion.div>
      </section>

      {/* News Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeInItem}>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Lajmet e Fundit</h2>
                <p className="mt-4 text-lg text-slate-600">Qëndroni të informuar me zhvillimet më të reja në Olive Medical.</p>
            </motion.div>
            <motion.div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeInStagger}>
                {laboratoryNews.map((news, index) => (
                <motion.div key={index} variants={fadeInItem} className="flex flex-col rounded-lg shadow-lg overflow-hidden group">
                    <div className="flex-shrink-0 h-48 overflow-hidden"><img src={news.image} alt={news.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /></div>
                    <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-600">{news.date}</p>
                        <a href="#" className="block mt-2">
                        <p className="text-xl font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">{news.title}</p>
                        <p className="mt-3 text-base text-slate-500">{news.summary}</p>
                        </a>
                    </div>
                    <div className="mt-6 flex items-center">
                        <a href="#" className="text-base font-semibold text-emerald-600 hover:text-emerald-500 flex items-center">Lexo më shumë<ChevronRightIcon className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" /></a>
                    </div>
                    </div>
                </motion.div>
                ))}
            </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-slate-800 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div>
                <h3 className="text-xl font-bold mb-6">Olive Medical</h3>
                <p className="text-slate-400 mb-4">Përkushtim dhe ekselencë në kujdesin shëndetësor për ju dhe familjen tuaj.</p>
                <div className="flex gap-4">
                    {socialLinks.map((social) => (
                    <a key={social.name} href={social.href} className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center hover:bg-emerald-600 transition-colors" aria-label={`Visit our ${social.name} page`}>
                        <social.icon className="w-5 h-5" /> 
                    </a>
                    ))}
                </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold mb-6">Linqe të Shpejta</h3>
                    <ul className="space-y-3">
                        <li><a href="#services" className="text-slate-400 hover:text-emerald-300 transition-colors">Shërbimet Tona</a></li>
                        <li><a href="#staff" className="text-slate-400 hover:text-emerald-300 transition-colors">Ekipi Ynë</a></li>
                        <li><a href="#" className="text-slate-400 hover:text-emerald-300 transition-colors">Blog</a></li>
                        <li><a href="#" className="text-slate-400 hover:text-emerald-300 transition-colors">Karriera</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-bold mb-6">Për Pacientët</h3>
                    <ul className="space-y-3">
                        <li><a href="#" className="text-slate-400 hover:text-emerald-300 transition-colors">Rezervo Takim</a></li>
                        <li><a href="#" className="text-slate-400 hover:text-emerald-300 transition-colors">Pyetje të Shpeshta</a></li>
                        <li><a href="#" className="text-slate-400 hover:text-emerald-300 transition-colors">Sigurimet Shëndetësore</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-bold mb-6">Na Kontaktoni</h3>
                    <ul className="space-y-3 text-slate-400">
                        <li>Rruga e Spitalit, Prishtinë</li>
                        <li>info@olivemedical-ks.com</li>
                        <li>+383 49 123 456</li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center">
                <div className="text-slate-400 mb-4 md:mb-0">© {new Date().getFullYear()} Olive Medical Center. Të gjitha të drejtat e rezervuara.</div>
                <div className="flex gap-6">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">Termat</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">Privatësia</a>
                </div>
            </div>
        </div>
      </footer>
      
      {/* AI Assistant Button */}
      <button
        onClick={handleOpenModal}
        className="fixed bottom-6 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-transform hover:scale-110 z-[9998]"
        aria-label="Open Olive AI Assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {showNotification && (
          <span className="absolute top-[-1.5rem] right-[3.5rem] w-auto px-3 py-1 text-sm text-white z-5 bg-slate-700 rounded-full border-2 border-white animate-pulse whitespace-nowrap">Keni nevojë për ndihmë?</span>
        )}
      </button>

      {/* Render the AI Modal */}
      <AiModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        lang={currentLang}
        currentUserId={sessionId}
      />
    </div>
  );
};

export default OliveHome;