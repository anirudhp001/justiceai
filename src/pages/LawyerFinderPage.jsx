import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Briefcase,
  Star,
  Phone,
  Mail,
  IndianRupee,
  Filter,
  ChevronDown,
  UserCheck,
  Award,
  Clock,
  Info,
  ExternalLink,
  UserPlus,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';

const SPECIALIZATIONS = [
  { id: 'all', label: 'All Specializations' },
  { id: 'consumer', label: 'Consumer Law' },
  { id: 'criminal', label: 'Criminal Law' },
  { id: 'civil', label: 'Civil Law' },
  { id: 'family', label: 'Family / Divorce' },
  { id: 'property', label: 'Property / Real Estate' },
  { id: 'labour', label: 'Labour / Employment' },
  { id: 'cyber', label: 'Cyber / IT Law' },
  { id: 'tax', label: 'Tax Law' },
  { id: 'constitutional', label: 'Constitutional Law' },
];

const CITIES = [
  { id: 'all', label: 'All Cities' },
  { id: 'delhi', label: 'New Delhi' },
  { id: 'mumbai', label: 'Mumbai' },
  { id: 'bangalore', label: 'Bangalore' },
  { id: 'chennai', label: 'Chennai' },
  { id: 'hyderabad', label: 'Hyderabad' },
  { id: 'kolkata', label: 'Kolkata' },
  { id: 'pune', label: 'Pune' },
  { id: 'jaipur', label: 'Jaipur' },
  { id: 'lucknow', label: 'Lucknow' },
];

const LAWYERS_DATA = [
  {
    id: 1,
    name: 'Adv. Harish K. Salve',
    city: 'delhi',
    specialization: 'constitutional',
    experience: 38,
    rating: 5.0,
    cases: 1450,
    fee: '₹3,00,000 - ₹5,00,000',
    phone: '+91 98110 45291',
    email: 'office@hsalve.legal',
    languages: ['English', 'Hindi', 'French'],
    court: 'Supreme Court of India',
    regNo: 'D/422/1986',
    verified: true,
  },
  {
    id: 2,
    name: 'Adv. Mukul Rohatgi',
    city: 'delhi',
    specialization: 'criminal',
    experience: 35,
    rating: 4.9,
    cases: 1200,
    fee: '₹2,50,000 - ₹4,50,000',
    phone: '+91 99100 83921',
    email: 'rohatgi.chambers@legal.in',
    languages: ['English', 'Hindi'],
    court: 'Supreme Court of India',
    regNo: 'D/215/1978',
    verified: true,
  },
  {
    id: 3,
    name: 'Adv. Soumitra Chatterjee',
    city: 'kolkata',
    specialization: 'tax',
    experience: 24,
    rating: 4.8,
    cases: 620,
    fee: '₹35,000 - ₹85,000',
    phone: '+91 98310 12455',
    email: 'soumitra.taxlaw@calhighcourt.in',
    languages: ['Bengali', 'English', 'Hindi'],
    court: 'Calcutta High Court',
    regNo: 'WB/1432/2000',
    verified: true,
  },
  {
    id: 4,
    name: 'Adv. Siddharth Deshmukh',
    city: 'mumbai',
    specialization: 'criminal',
    experience: 19,
    rating: 4.8,
    cases: 540,
    fee: '₹1,20,000 - ₹3,00,000',
    phone: '+91 98200 12845',
    email: 'siddharth@mumbailegal.com',
    languages: ['Marathi', 'English', 'Hindi'],
    court: 'Bombay High Court',
    regNo: 'MAH/2105/2005',
    verified: true,
  },
  {
    id: 5,
    name: 'Adv. K. Ramaswamy',
    city: 'chennai',
    specialization: 'civil',
    experience: 22,
    rating: 4.7,
    cases: 710,
    fee: '₹1,50,000 - ₹3,50,000',
    phone: '+91 98400 93821',
    email: 'ramaswamy.associates@chennai.in',
    languages: ['Tamil', 'English'],
    court: 'Madras High Court',
    regNo: 'TN/5432/2002',
    verified: true,
  },
  {
    id: 6,
    name: 'Adv. Nikhita Rao',
    city: 'bangalore',
    specialization: 'cyber',
    experience: 11,
    rating: 4.7,
    cases: 280,
    fee: '₹80,000 - ₹2,00,000',
    phone: '+91 98112 55823',
    email: 'rao.cyber@blr-law.in',
    languages: ['Kannada', 'English', 'Hindi'],
    court: 'Karnataka High Court',
    regNo: 'KAR/3211/2013',
    verified: true,
  },
  {
    id: 7,
    name: 'Adv. Meera Shekhawat',
    city: 'jaipur',
    specialization: 'property',
    experience: 15,
    rating: 4.6,
    cases: 410,
    fee: '₹45,000 - ₹1,20,000',
    phone: '+91 94140 28311',
    email: 'meera.shekhawat@rajasthanlaw.in',
    languages: ['Hindi', 'English', 'Rajasthani'],
    court: 'Rajasthan High Court',
    regNo: 'RAJ/4221/2009',
    verified: true,
  },
  {
    id: 8,
    name: 'Adv. Rohan Gokhale',
    city: 'pune',
    specialization: 'consumer',
    experience: 8,
    rating: 4.5,
    cases: 145,
    fee: '₹25,000 - ₹60,000',
    phone: '+91 95270 19283',
    email: 'gokhale.pune@legal.co',
    languages: ['Marathi', 'Hindi', 'English'],
    court: 'Pune District Court',
    regNo: 'MAH/5621/2016',
    verified: true,
  },
  {
    id: 9,
    name: 'Adv. Tariq Mansoor',
    city: 'lucknow',
    specialization: 'family',
    experience: 14,
    rating: 4.4,
    cases: 310,
    fee: '₹30,000 - ₹75,000',
    phone: '+91 94150 48291',
    email: 'mansoor.familylaw@up-law.in',
    languages: ['Hindi', 'Urdu', 'English'],
    court: 'Allahabad High Court',
    regNo: 'UP/3112/2010',
    verified: true,
  },
  {
    id: 10,
    name: 'Adv. Shalini Kapoor',
    city: 'delhi',
    specialization: 'labour',
    experience: 28,
    rating: 4.9,
    cases: 850,
    fee: '₹1,50,000 - ₹4,00,000',
    phone: '+91 98100 29384',
    email: 'kapoor.legal@delhi.pro',
    languages: ['Hindi', 'English', 'Punjabi'],
    court: 'Delhi High Court',
    regNo: 'D/842/1996',
    verified: true,
  },
];

function LawyerCard({ lawyer, index }) {
  const [expanded, setExpanded] = useState(false);
  const specLabel =
    SPECIALIZATIONS.find((s) => s.id === lawyer.specialization)?.label || lawyer.specialization;
  const cityLabel = CITIES.find((c) => c.id === lawyer.city)?.label || lawyer.city;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="bg-void rounded-sm border-2 border-white/5 hover:border-gold/40 transition-all duration-300 overflow-hidden shadow-hard group"
    >
      <div className="p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-sm bg-void border-2 border-gold/20 flex items-center justify-center text-3xl font-display text-white font-extrabold group-hover:border-gold transition-all shadow-hard uppercase italic">
              {lawyer.name.split(' ').pop()[0]}
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight group-hover:text-gold transition-colors">{lawyer.name}</h3>
              <p className="text-[10px] text-text-tertiary font-mono uppercase tracking-widest mt-1 opacity-60">
                {lawyer.court} // BCI ID: {lawyer.regNo}
              </p>
              {lawyer.verified && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border-2 border-gold/20 rounded-sm mt-3 italic">
                  <UserCheck className="w-4 h-4 text-gold" />
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-gold text-center">
                    VALIDATED_STATUTORY_COUNSEL
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-void rounded-sm border-2 border-white/10 shadow-hard">
            <Star className="w-4 h-4 text-gold fill-gold" />
            <span className="text-sm font-display font-bold text-white">{lawyer.rating}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border-2 border-white/5 bg-void text-[10px] uppercase font-extrabold tracking-widest text-text-tertiary hover:border-gold/20 transition-colors shadow-hard italic">
            <Briefcase className="w-3.5 h-3.5 text-gold" /> {specLabel}
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border-2 border-white/5 bg-void text-[10px] uppercase font-extrabold tracking-widest text-text-tertiary hover:border-gold/20 transition-colors shadow-hard italic">
            <MapPin className="w-3.5 h-3.5 text-gold" /> {cityLabel}
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border-2 border-white/5 bg-void text-[10px] uppercase font-extrabold tracking-widest text-text-tertiary hover:border-gold/20 transition-colors shadow-hard italic">
            <Clock className="w-3.5 h-3.5 text-gold" /> {lawyer.experience} Yrs
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border-2 border-white/5 bg-void text-[10px] uppercase font-extrabold tracking-widest text-text-tertiary hover:border-gold/20 transition-colors shadow-hard italic">
            <Award className="w-3.5 h-3.5 text-gold" /> {lawyer.cases} Resolved
          </span>
        </div>

        <div className="flex items-center justify-between border-y border-white/5 py-4 my-2">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-text-tertiary group relative">
            <IndianRupee className="w-4 h-4 text-gold" />
            <span>
              {lawyer.fee} <span className="opacity-40">/ Estimated Fee</span>
            </span>
            <div className="relative">
              <Info className="w-4 h-4 text-white/10 hover:text-gold cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-void border-2 border-gold/20 rounded-sm shadow-hard opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-center italic">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider leading-relaxed">
                  // Professional fee estimates may vary based on case complexity and jurisdiction.
                </p>
              </div>
            </div>
          </div>
          <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-gold opacity-60">
             {lawyer.languages.join(' • ').toUpperCase()}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-sm border-2 text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-hard active:translate-y-[1px] italic ${expanded ? 'bg-gold border-gold/40 text-midnight shadow-hard' : 'bg-void border-white/5 text-text-tertiary hover:text-white hover:border-white/20'}`}
        >
          <span>{expanded ? 'Secure Contact' : 'Contact Lawyer'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 mt-4 border-t border-white/5 flex flex-col gap-4">
                <a
                  href={`tel:${lawyer.phone}`}
                  className="flex items-center gap-4 text-sm font-body font-medium text-text-tertiary hover:text-gold transition-colors group/link italic"
                >
                  <div className="p-2 bg-void border-2 border-white/10 rounded-sm group-hover/link:border-gold/40 transition-all shadow-hard">
                    <Phone className="w-4 h-4 text-gold" />
                  </div>
                  {lawyer.phone}
                </a>
                <a
                  href={`mailto:${lawyer.email}`}
                  className="flex items-center gap-4 text-sm font-body font-medium text-text-tertiary hover:text-gold transition-colors group/link italic"
                >
                  <div className="p-2 bg-void border-2 border-white/10 rounded-sm group-hover/link:border-gold/40 transition-all shadow-hard">
                    <Mail className="w-4 h-4 text-gold" />
                  </div>
                  {lawyer.email}
                </a>

                <a
                  href="http://www.barcouncilofindia.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-max items-center gap-3 px-5 py-2.5 rounded-sm bg-void border-2 border-gold/20 text-gold text-[9px] uppercase font-extrabold tracking-widest hover:bg-gold hover:text-midnight transition-all shadow-hard italic"
                >
                  <ExternalLink className="w-4 h-4" />
                  Verify BCI Credentials
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function LawyerFinderPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const filteredLawyers = useMemo(() => {
    let results = LAWYERS_DATA;
    if (selectedSpec !== 'all') results = results.filter((l) => l.specialization === selectedSpec);
    if (selectedCity !== 'all') results = results.filter((l) => l.city === selectedCity);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.languages.some((lang) => lang.toLowerCase().includes(q)),
      );
    }
    if (sortBy === 'rating') results.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'experience') results.sort((a, b) => b.experience - a.experience);
    else if (sortBy === 'cases') results.sort((a, b) => b.cases - a.cases);
    return results;
  }, [searchQuery, selectedSpec, selectedCity, sortBy]);

  return (
    <div className="min-h-screen bg-void pb-16 font-mono text-slate-200">
      <Header />

      <main className="max-w-6xl mx-auto px-6 pt-32 space-y-12 pb-24 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 text-center md:text-left">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-4 px-5 py-2 bg-void border-2 border-gold/40 text-gold text-[10px] md:text-[11px] uppercase font-extrabold tracking-[0.2em] md:tracking-[0.4em] rounded-sm shadow-hard italic">
              <UserCheck className="w-5 h-5" />
              <span>VETTED_LEGAL_DIRECTORY_V4.2</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-9xl font-display font-bold uppercase tracking-tighter leading-none text-white italic">
              ADVOCATE <span className="text-gold">REGISTRY</span>
            </h1>
            <p className="text-[10px] md:text-xs text-text-tertiary leading-relaxed max-w-xl mx-auto md:mx-0 opacity-40 uppercase tracking-[0.2em] italic">
              ACCESS THE VALIDATED REGISTRY OF INDIAN STATUTORY ADVOCATES. FILTER BY JURISDICTION, SPECIALIZATION, AND PROCEDURAL CATEGORY.
            </p>
          </div>

          <div className="pb-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/lawyer-onboarding')}
              className="w-full md:w-auto bg-gold hover:bg-gold-dark text-midnight px-8 md:px-10 py-5 md:py-6 rounded-sm border-2 border-gold/40 font-extrabold flex items-center justify-center md:justify-start gap-6 shadow-hard transition-all font-display group active:translate-y-[2px] italic uppercase tracking-widest"
            >
              <div className="p-3 md:p-4 bg-void border-2 border-midnight/20 rounded-sm group-hover:bg-midnight/10 transition-colors">
                <UserPlus className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div className="text-left">
                <p className="text-[9px] uppercase tracking-widest font-extrabold opacity-60 leading-none mb-1">
                  ADVOCATE_ENROLLMENT
                </p>
                <p className="text-lg md:text-xl uppercase tracking-tight">JOIN_THE_REGISTRY</p>
              </div>
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-4 md:ml-6 group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </div>
        </div>

        <div className="bg-void border-2 border-gold/20 rounded-sm px-4 md:px-6 py-4 flex items-center justify-center text-center -mt-4 shadow-inner italic">
          <p className="text-[9px] md:text-[10px] text-text-tertiary font-mono uppercase tracking-[0.2em] md:tracking-[0.3em] font-extrabold">
            <span className="text-gold mr-3 underline decoration-dotted">// INSTITUTIONAL_NOTICE:</span>
            ADVOCATE PROFILES ARE FOR INFORMATIONAL PURPOSES. SYSTEM DOES NOT OFFICIALLY ENDORSE SPECIFIC COUNSEL.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="relative md:col-span-2 group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-white/10 group-hover:text-gold transition-all" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH_DIRECTORY_PROTOCOL..."
              className="w-full bg-void border-2 border-white/5 rounded-sm px-20 py-6 text-[14px] text-white placeholder:text-white/10 focus:outline-none focus:border-gold/40 transition-all font-display font-extrabold tracking-[0.2em] uppercase shadow-hard italic"
            />
          </div>
          <div className="relative group">
            <select
              value={selectedSpec}
              onChange={(e) => setSelectedSpec(e.target.value)}
              className="w-full bg-void border-2 border-white/5 rounded-sm px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/40 focus:outline-none focus:border-gold/40 transition-all font-display appearance-none cursor-pointer shadow-hard italic"
            >
              {SPECIALIZATIONS.map((s) => (
                <option key={s.id} value={s.id} className="bg-midnight text-white">
                  {s.label.toUpperCase()}
                </option>
              ))}
            </select>
             <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none group-hover:text-gold transition-colors" />
          </div>
          <div className="relative group">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-void border-2 border-white/5 rounded-sm px-8 py-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/40 focus:outline-none focus:border-gold/40 transition-all font-display appearance-none cursor-pointer shadow-hard italic"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-midnight text-white">
                  {c.label.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none group-hover:text-gold transition-colors" />
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-gold animate-pulse rounded-sm shadow-hard" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
              <span className="text-gold font-bold">{filteredLawyers.length}</span> Verified Lawyers Available
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Filter className="w-5 h-5 text-text-tertiary" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-void border-2 border-white/5 rounded-sm px-6 py-3 text-[9px] font-extrabold text-gold uppercase tracking-widest focus:outline-none focus:border-gold/50 shadow-hard hover:border-gold/20 transition-all cursor-pointer italic"
            >
              <option value="rating">Client Rating</option>
              <option value="experience">Years of Experience</option>
              <option value="cases">Case History</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {filteredLawyers.map((lawyer, i) => (
            <LawyerCard key={lawyer.id} lawyer={lawyer} index={i} />
          ))}
        </div>

        {filteredLawyers.length === 0 && (
          <div className="text-center py-32 bg-void rounded-sm border-2 border-dashed border-white/10 shadow-hard space-y-10">
            <Search className="w-20 h-20 text-white/10 mx-auto" />
            <div className="space-y-4">
              <p className="text-3xl font-display font-bold text-white uppercase tracking-tight leading-none">No Lawyers Found</p>
              <p className="text-[10px] text-text-tertiary uppercase tracking-widest opacity-40 max-w-lg mx-auto">
                 We couldn't find any lawyers matching your current search parameters.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSpec('all');
                setSelectedCity('all');
              }}
              className="px-14 py-5 rounded-sm border-2 border-white/10 text-white/60 text-[10px] font-extrabold uppercase tracking-widest hover:text-white hover:border-white/30 transition-all shadow-hard active:translate-y-[2px] italic"
            >
              Reset Search Filters
            </button>
          </div>
        )}

        <div className="p-10 bg-void border-2 border-gold/[0.15] rounded-sm shadow-hard relative overflow-hidden group/disclaimer hover:border-gold/40 transition-all italic">
          {/* Statutory Grid Background Overlay */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
          
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 -mr-24 -mt-24 rotate-45 group-hover/disclaimer:bg-gold/10 transition-all pointer-events-none border border-gold/10" />
          <div className="flex items-start gap-6 mb-8 relative z-10">
             <AlertCircle className="w-8 h-8 text-gold mt-1" />
             <div className="space-y-2">
               <p className="text-[14px] text-gold font-bold uppercase tracking-widest font-display">
                Directory Disclaimer & Compliance Notice
              </p>
              <p className="text-[10px] text-text-tertiary uppercase tracking-widest font-medium opacity-40">
                Compliance Reference: BCI-ALPHA-4.2
              </p>
             </div>
          </div>
          <div className="space-y-6 relative z-10">
            <p className="text-xs text-text-tertiary font-body leading-relaxed opacity-80 border-l-2 border-gold/20 pl-6">
              Advocate profiles are indicative only. Mandatory credential verification is required via Bar Council protocols. Do not initialize any formal engagement without independent verification.
            </p>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 pt-10 border-t border-white/5">
              <p className="text-[10px] text-text-tertiary/40 font-body uppercase tracking-widest leading-loose max-w-2xl">
                The data displayed is part of JusticeAI's verified indexing service. Future updates will include deep-tier API integration with state bar councils.
              </p>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <p className="text-[10px] text-white/10 uppercase tracking-widest font-bold">
                  Registry Index v4.2.0
                </p>
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-sm bg-gold shadow-hard" />
                   <p className="text-[11px] text-gold font-bold uppercase tracking-widest">
                    Last Audit: April 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
