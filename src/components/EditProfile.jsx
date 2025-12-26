import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Plus,
  Check,
  Heart,
  X,
  User, 
  Loader,
  Briefcase,
  MapPin,
  Camera,
  Upload,
  Ruler,
  BookOpen,
  Users,
  MessageSquare,
  GlassWater,
  Cigarette,
  Dumbbell,
  Utensils,
  Moon,
  Cat,
  Sprout,
  Music,
  EyeOff,
  School,
  Building,
  Mic,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// --- CONFIGURATION & UTILITIES ---
const getUserDocPath = (userId) => {
  const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
  return `artifacts/${appId}/users/${userId}/profile/data`;
};

// --- HELPER COMPONENTS ---
const ToggleSwitch = ({ initialChecked = false, onChange }) => {
  const [isChecked, setIsChecked] = useState(initialChecked);
  useEffect(() => setIsChecked(initialChecked), [initialChecked]);
  const handleToggle = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    if (onChange) onChange(newValue);
  };
  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none`}
      style={{ backgroundColor: isChecked ? "#0ea5e9" : "#3f3f46" }}
    >
      <span
        className={`${
          isChecked ? "translate-x-6" : "translate-x-1"
        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out shadow`}
      />
    </button>
  );
};

const ProfileSection = ({
  title,
  children,
  badge,
  badgeColor = "bg-sky-500",
}) => (
  <div className="bg-zinc-900 mt-4 border border-white/5 rounded-xl overflow-hidden shadow-xl">
    <div className="bg-zinc-800/50 px-4 py-3 flex items-center justify-between border-b border-white/5">
      <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wide">
        {title}
      </h2>
      {badge && (
        <span
          className={`${badgeColor} text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase`}
        >
          {badge}
        </span>
      )}
    </div>
    <div>{children}</div>
  </div>
);

const ListItem = ({
  icon,
  title,
  value,
  hasChevron = true,
  valueColor = "text-sky-400",
  onClick,
}) => {
  const IconComponent = icon;
  const displayValue = Array.isArray(value) ? value.join(", ") : value;
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 disabled:opacity-50"
      disabled={!onClick}
    >
      <div className="flex items-center">
        {IconComponent && (
          <IconComponent className="w-5 h-5 text-zinc-500 mr-3 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-base text-white">{title}</p>
        </div>
        <div className="flex items-center ml-2">
          <p className={`text-sm ${valueColor} mr-2 truncate max-w-[150px]`}>
            {displayValue || "Add"}
          </p>
          {hasChevron && (
            <ChevronRight className="w-5 h-5 text-zinc-700 flex-shrink-0" />
          )}
        </div>
      </div>
    </button>
  );
};

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/80 z-[100] flex items-end lg:items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 w-full lg:max-w-md rounded-t-2xl lg:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-zinc-900 border-b border-white/5 px-4 py-4 flex items-center justify-between z-10">
          <button
            onClick={onClose}
            className="text-zinc-500 p-1 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
          <div className="w-6" />
        </div>
        <div className="p-4 bg-zinc-900">{children}</div>
      </div>
    </div>
  );
};

const SelectModal = ({
  isOpen,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  allowMultiple = false,
}) => {
  const [selected, setSelected] = useState(
    allowMultiple ? (Array.isArray(selectedValue) ? selectedValue : []) : selectedValue
  );
  
  useEffect(() => {
    setSelected(allowMultiple ? (Array.isArray(selectedValue) ? selectedValue : []) : selectedValue);
  }, [selectedValue, allowMultiple]);

  const handleSelect = (value) => {
    if (allowMultiple) {
      const newSelected = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      setSelected(newSelected);
    } else {
      setSelected(value);
      onSelect(value);
      onClose();
    }
  };
  const handleDone = () => {
    if (allowMultiple) onSelect(selected);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={allowMultiple ? handleDone : onClose}
      title={title}
    >
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between shadow-sm ${
                (allowMultiple ? selected?.includes(option.value) : selected === option.value)
                  ? "bg-sky-500/10 border-sky-500 text-sky-400"
                  : "bg-zinc-800 border-white/5 text-zinc-300 hover:border-zinc-600"
              }`}
          >
            <span className="text-white text-base">{option.label}</span>
            {(allowMultiple
              ? selected?.includes(option.value)
              : selected === option.value) && (
              <Check className="w-5 h-5 text-sky-400" />
            )}
          </button>
        ))}
      </div>
      {allowMultiple && (
        <button
          onClick={handleDone}
          className="w-full mt-6 bg-gradient-to-r from-sky-400 to-blue-600 text-black rounded-full py-3 font-black hover:opacity-90 shadow-lg transition"
        >
          Done
        </button>
      )}
    </Modal>
  );
};

const TextInputModal = ({
  isOpen,
  onClose,
  title,
  value,
  onSave,
  placeholder,
  maxLength,
}) => {
  const [text, setText] = useState(value || "");
  useEffect(() => {
    setText(value || "");
  }, [value]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-black border border-white/10 rounded-xl p-4 min-h-[150px] text-white focus:outline-none focus:border-sky-500 resize-none shadow-inner"
      />
      <div className="flex justify-end items-center mt-2">
        <span className="text-sm text-zinc-500 font-medium">
          {text.length}/{maxLength}
        </span>
      </div>
      <button
        onClick={() => {
          onSave(text);
          onClose();
        }}
        disabled={!text.trim()}
        className="w-full mt-4 bg-gradient-to-r from-sky-400 to-blue-600 text-black rounded-full py-3 font-black hover:opacity-90 transition disabled:opacity-50"
      >
        Save
      </button>
    </Modal>
  );
};

const InterestsModal = ({ isOpen, onClose, selectedInterests, onSave }) => {
  const [selected, setSelected] = useState(selectedInterests || []);
  useEffect(() => {
    setSelected(selectedInterests || []);
  }, [selectedInterests]);
  const interestCategories = {
    "Going Out": [
      "🍷 Wine Tasting",
      "🎭 Theater",
      "🎵 Live Music",
      "🎪 Festivals",
      "🍻 Bar Hopping",
      "🎤 Karaoke",
    ],
    "Staying In": [
      "📺 Netflix",
      "📚 Reading",
      "🎮 Gaming",
      "🍳 Cooking",
      "🎨 Art",
      "✍️ Writing",
    ],
    "Creative Arts": [
      "📸 Photography",
      "🎬 Film",
      "🎹 Music",
      "💃 Dancing",
      "🖼️ Museums",
      "🎪 DIY",
    ],
    "Sports & Fitness": [
      "⚽ Soccer",
      "🏀 Basketball",
      "🏋️ Gym",
      "🧘 Yoga",
      "🏃 Running",
      "🚴 Cycling",
    ],
    Outdoor: [
      "🏕️ Camping",
      "🥾 Hiking",
      "🏖️ Beach",
      "🌄 Travel",
      "🎣 Fishing",
      "⛷️ Skiing",
    ],
    "Food & Drink": [
      "☕ Coffee",
      "🍕 Pizza",
      "🍜 Foodie",
      "🍰 Baking",
      "🍣 Sushi",
      "🌮 Tacos",
    ],
  };
  const toggleInterest = (interest) => {
    if (selected.includes(interest))
      setSelected(selected.filter((i) => i !== interest));
    else if (selected.length < 5) setSelected([...selected, interest]);
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Interests">
      <p className="text-sm text-zinc-400 mb-4">
        Choose up to 5 interests (
        <span className="font-bold text-sky-400">{selected.length}/5</span>)
      </p>
      <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
        {Object.entries(interestCategories).map(([category, interests]) => (
          <div key={category}>
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">
              {category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full border transition-all text-sm font-medium ${
                    selected.includes(interest)
                      ? "bg-sky-500 text-black border-sky-500 shadow-lg shadow-sky-500/20"
                      : "bg-zinc-800 text-zinc-300 border-white/5 hover:border-sky-500/50"
                  }`}
                  disabled={
                    !selected.includes(interest) && selected.length >= 5
                  }
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          onSave(selected);
          onClose();
        }}
        disabled={selected.length === 0}
        className="w-full mt-6 bg-gradient-to-r from-sky-400 to-blue-600 text-black rounded-full py-3 font-black hover:opacity-90 transition disabled:opacity-50"
      >
        Save Interests
      </button>
    </Modal>
  );
};

const PromptsModal = ({ isOpen, onClose, prompts, onSave }) => {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [answer, setAnswer] = useState("");
  const promptOptions = [
    "I'm looking for...",
    "My most controversial opinion is...",
    "Don't hate me if I...",
    "I'm overly competitive about...",
    "The way to win me over is...",
    "I'm weirdly attracted to...",
    "Biggest risk I've taken...",
    "I go crazy for...",
    "Let's debate this topic...",
    "I'll pick the restaurant if...",
  ];

  const handleSavePrompt = () => {
    if (selectedPrompt && answer.trim()) {
      onSave({ question: selectedPrompt, answer });
      setSelectedPrompt(null);
      setAnswer("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Prompt">
      {!selectedPrompt ? (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {promptOptions.map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setSelectedPrompt(prompt);
                setAnswer("");
              }}
              className="w-full text-left px-4 py-3 rounded-xl bg-zinc-800 border border-white/5 text-zinc-200 hover:border-sky-500 transition-colors shadow-sm"
            >
              <span className="text-white text-base font-medium">{prompt}</span>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="bg-zinc-800 rounded-lg p-4 mb-4 border border-white/5">
            <p className="text-sm font-bold text-sky-400">
              {selectedPrompt}
            </p>
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer..."
            maxLength={150}
            className="w-full bg-black border border-white/10 rounded-xl p-4 min-h-[120px] text-white focus:outline-none focus:border-sky-500 resize-none shadow-inner"
          />
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={() => setSelectedPrompt(null)}
              className="text-zinc-500 text-xs font-bold uppercase hover:text-sky-400 transition tracking-widest"
            >
              ← Change Prompt
            </button>
            <span className="text-xs text-zinc-500 font-bold">
              {answer.length}/150
            </span>
          </div>
          <button
            onClick={handleSavePrompt}
            disabled={!answer.trim()}
            className="w-full mt-4 bg-gradient-to-r from-sky-400 to-blue-600 text-black rounded-full py-3 font-black hover:opacity-90 transition disabled:opacity-50 shadow-lg"
          >
            Add to Profile
          </button>
        </div>
      )}
    </Modal>
  );
};

const PhotoOptionsModal = ({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectGallery,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Add Photo">
    <div className="space-y-3">
      <button
        onClick={() => {
          onSelectCamera();
          onClose();
        }}
        className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-xl bg-zinc-800 border border-white/5 hover:border-sky-500 transition-colors shadow-md text-white"
      >
        <Camera className="w-6 h-6 text-sky-400" />
        <span className="text-lg font-bold text-white">Take Photo</span>
      </button>
      <button
        onClick={() => {
          onSelectGallery();
          onClose();
        }}
        className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-xl bg-zinc-800 border border-white/5 hover:border-sky-500 transition-colors shadow-md text-white"
      >
        <Upload className="w-6 h-6 text-sky-400" />
        <span className="text-lg font-bold text-white">
          Choose from Gallery
        </span>
      </button>
    </div>
  </Modal>
);

const PreviewProfile = ({ profileData }) => {
  const defaultPhoto =
    "https://placehold.co/300x400/0c4a6e/e0f2fe?text=Main+Photo";
  const firstPhoto =
    profileData.photos && profileData.photos.length > 0
      ? profileData.photos[0]
      : defaultPhoto;

  return (
    <div className="bg-black min-h-screen pb-20 p-4">
      <div className="bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden max-w-lg mx-auto border border-white/5">
        <div className="relative h-[550px] bg-zinc-800">
          <img
            src={firstPhoto}
            alt="Profile Preview"
            className="w-full h-full object-cover"
            onError={(e) => (e.target.src = defaultPhoto)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-black text-white">
                {profileData.name || "You"}, {profileData.age || "21"}
              </h1>
              <CheckCircle2 size={24} className="text-sky-400 fill-white" />
            </div>
            <p className="text-zinc-300 text-sm font-medium mt-1 uppercase tracking-wider">
              Lives in {profileData.city || "Your City"}
            </p>
          </div>
        </div>
        <div className="p-6 space-y-8">
          {profileData.aboutMe && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">About Me</h3>
              <p className="text-zinc-200 leading-relaxed text-lg font-medium italic border-l-2 border-sky-500 pl-4">"{profileData.aboutMe}"</p>
            </div>
          )}
          {profileData.prompts?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                My Prompts
              </h3>
              {profileData.prompts.map((prompt, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-800/50 rounded-2xl p-5 border border-white/5 shadow-sm"
                >
                  <p className="text-xs font-black text-sky-400 mb-2 uppercase tracking-tighter">
                    {prompt.question}
                  </p>
                  <p className="text-white font-bold text-lg">{prompt.answer}</p>
                </div>
              ))}
            </div>
          )}
          {profileData.interests?.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="bg-sky-500/10 text-sky-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter border border-sky-500/20"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-8 text-center">
        <p className="text-zinc-600 text-xs font-bold uppercase tracking-[0.2em]">
          This is how your profile looks to others
        </p>
      </div>
    </div>
  );
};

// --- Main Edit Profile Component ---
export default function EditProfile({
  onNavigate,
  userData,
  setUserData,
  db,
  userId,
  storage,
}) {
  const profile = userData?.profile || {};
  const MAX_PHOTOS = 6;
  const [activeTab, setActiveTab] = useState("edit");
  
  // --- State Initialization ---
  const [photos, setPhotos] = useState(
    Array.isArray(profile.photos) ? profile.photos : []
  );
  const [smartPhotos, setSmartPhotos] = useState(profile.smartPhotos ?? true);
  const [aboutMe, setAboutMe] = useState(profile.aboutMe || "");
  const [prompts, setPrompts] = useState(profile.prompts || []);
  const [interests, setInterests] = useState(profile.interests || []);
  const [lookingFor, setLookingFor] = useState(
    profile.lookingFor || "female"
  );
  const [pronouns, setPronouns] = useState(profile.pronouns || "");
  const [height, setHeight] = useState(profile.height || "");
  const [relationshipType, setRelationshipType] = useState(
    profile.relationshipType || []
  );
  const [languages, setLanguages] = useState(profile.languages || []);
  const [zodiac, setZodiac] = useState(profile.zodiac || "");
  const [education, setEducation] = useState(profile.education || "");
  const [familyPlans, setFamilyPlans] = useState(profile.familyPlans || "");
  const [personalityType, setPersonalityType] = useState(
    profile.personalityType || ""
  );
  const [communicationStyle, setCommunicationStyle] = useState(
    profile.communicationStyle || ""
  );
  const [loveStyle, setLoveStyle] = useState(profile.loveStyle || "");
  const [pets, setPets] = useState(profile.pets || "");
  const [drinking, setDrinking] = useState(profile.drinking || "");
  const [smoking, setSmoking] = useState(profile.smoking || "");
  const [workout, setWorkout] = useState(profile.workout || "");
  const [diet, setDiet] = useState(profile.diet || "");
  const [socialMedia, setSocialMedia] = useState(profile.socialMedia || "");
  const [sleeping, setSleeping] = useState(profile.sleeping || "");
  const [school, setSchool] = useState(profile.school || "");
  const [jobTitle, setJobTitle] = useState(profile.jobTitle || "");
  const [company, setCompany] = useState(profile.company || "");
  const [city, setCity] = useState(profile.city || "Delhi");
  const [anthem, setAnthem] = useState(profile.anthem || "");
  const [hideAge, setHideAge] = useState(profile.hideAge ?? false);
  const [hideDistance, setHideDistance] = useState(
    profile.hideDistance ?? false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [gender, setGender] = useState(profile.gender || "");

  // --- Options Data ---
  
  // UPDATED: Now only Male and Female
  const lookingForOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];
  
  const pronounOptions = [
    { value: "She/Her", label: "She/Her" },
    { value: "He/Him", label: "He/Him" },
    { value: "They/Them", label: "They/Them" },
    { value: "Ze/Zir", label: "Ze/Zir" },
    { value: "Prefer not to say", label: "Prefer not to say" },
  ];
  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];

  const heightOptions = Array.from({ length: 60 }, (_, i) => {
    const inches = i + 48;
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return {
      value: `${feet}'${remainingInches}"`,
      label: `${feet}'${remainingInches}"`,
    };
  });
  const relationshipTypeOptions = [
    { value: "Monogamy", label: "Monogamy" },
    { value: "Ethically non-monogamous", label: "Ethically non-monogamous" },
    { value: "Open to exploring", label: "Open to exploring" },
    {
      value: "Figuring out my dating goals",
      label: "Figuring out my dating goals",
    },
  ];
  const languageOptions = [
    { value: "English", label: "English" },
    { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Hindi", label: "Hindi" },
    { value: "Mandarin", label: "Mandarin" },
    { value: "Japanese", label: "Japanese" },
    { value: "Korean", label: "Korean" },
  ];
  const zodiacOptions = [
    { value: "Aries", label: "Aries ♈" },
    { value: "Taurus", label: "Taurus ♉" },
    { value: "Gemini", label: "Gemini ♊" },
    { value: "Cancer", label: "Cancer ♋" },
    { value: "Leo", label: "Leo ♌" },
    { value: "Virgo", label: "Virgo ♍" },
    { value: "Libra", label: "Libra ♎" },
    { value: "Scorpio", label: "Scorpio ♏" },
    { value: "Sagittarius", label: "Sagittarius ♐" },
    { value: "Capricorn", label: "Capricorn ♑" },
    { value: "Aquarius", label: "Aquarius ♒" },
    { value: "Pisces", label: "Pisces ♓" },
  ];
  const educationOptions = [
    { value: "High School", label: "High School" },
    { value: "Trade School", label: "Trade School" },
    { value: "In College", label: "In College" },
    { value: "Undergraduate Degree", label: "Undergraduate Degree" },
    { value: "In Grad School", label: "In Grad School" },
    { value: "Graduate Degree", label: "Graduate Degree" },
  ];
  const familyPlansOptions = [
    { value: "Want someday", label: "Want someday" },
    { value: "Don't want", label: "Don't want" },
    { value: "Have and want more", label: "Have and want more" },
    { value: "Have and don't want more", label: "Have and don't want more" },
    { value: "Not sure yet", label: "Not sure yet" },
  ];
  const personalityOptions = [
    { value: "INTJ", label: "INTJ" },
    { value: "INTP", label: "INTP" },
    { value: "ENTJ", label: "ENTJ" },
    { value: "ENTP", label: "ENTP" },
    { value: "INFJ", label: "INFJ" },
    { value: "INFP", label: "INFP" },
    { value: "ENFJ", label: "ENFJ" },
    { value: "ENFP", label: "ENFP" },
    { value: "ISTJ", label: "ISTJ" },
    { value: "ISFJ", label: "ISFJ" },
    { value: "ESTJ", label: "ESTJ" },
    { value: "ESFJ", label: "ESFJ" },
    { value: "ISTP", label: "ISTP" },
    { value: "ISFP", label: "ISFP" },
    { value: "ESTP", label: "ESTP" },
    { value: "ESFP", label: "ESFP" },
  ];
  const communicationOptions = [
    { value: "Big time texter", label: "Big time texter" },
    { value: "Phone caller", label: "Phone caller" },
    { value: "Video chatter", label: "Video chatter" },
    { value: "Bad texter", label: "Bad texter" },
    { value: "Better in person", label: "Better in person" },
  ];
  const loveStyleOptions = [
    { value: "Thoughtful gestures", label: "Thoughtful gestures" },
    { value: "Presents", label: "Presents" },
    { value: "Touch", label: "Touch" },
    { value: "Compliments", label: "Compliments" },
    { value: "Time together", label: "Time together" },
  ];
  const petsOptions = [
    { value: "Dog", label: "🐕 Dog" },
    { value: "Cat", label: "🐈 Cat" },
    { value: "Both", label: "🐕🐈 Dog & Cat" },
    { value: "Other", label: "🐠 Other Pets" },
    { value: "None", label: "Pet-free" },
    { value: "Want", label: "Want a pet" },
    { value: "Allergic", label: "Allergic to pets" },
  ];
  const drinkingOptions = [
    { value: "Not for me", label: "Not for me" },
    { value: "Sober", label: "Sober" },
    { value: "Sober curious", label: "Sober curious" },
    { value: "On special occasions", label: "On special occasions" },
    { value: "Socially on weekends", label: "Socially on weekends" },
    { value: "Most nights", label: "Most nights" },
  ];
  const smokingOptions = [
    { value: "Non-smoker", label: "Non-smoker" },
    { value: "Smoker", label: "Smoker" },
    { value: "Social smoker", label: "Social smoker" },
    { value: "Trying to quit", label: "Trying to quit" },
  ];
  const workoutOptions = [
    { value: "Every day", label: "Every day" },
    { value: "Often", label: "Often" },
    { value: "Sometimes", label: "Sometimes" },
    { value: "Never", label: "Never" },
  ];
  const dietOptions = [
    { value: "Vegan", label: "Vegan" },
    { value: "Vegetarian", label: "Vegetarian" },
    { value: "Pescatarian", label: "Pescatarian" },
    { value: "Kosher", label: "Kosher" },
    { value: "Halal", label: "Halal" },
    { value: "Carnivore", label: "Carnivore" },
    { value: "Omnivore", label: "Omnivore" },
    { value: "Other", label: "Other" },
  ];
  const socialMediaOptions = [
    { value: "Influencer status", label: "Influencer status" },
    { value: "Socially active", label: "Socially active" },
    { value: "Off the grid", label: "Off the grid" },
    { value: "Passive scroller", label: "Passive scroller" },
  ];
  const sleepingOptions = [
    { value: "Early bird", label: "Early bird" },
    { value: "Night owl", label: "Night owl" },
    { value: "In a spectrum", label: "In a spectrum" },
  ];

  const handleAddPrompt = (newPrompt) => {
    if (prompts.length < 3) setPrompts([...prompts, newPrompt]);
  };

  const uploadPhotoToFirebase = async (file) => {
    const uniqueFileName = `${userId}-${Date.now()}-${file.name}`;
    const storagePath = `users/${userId}/photos/${uniqueFileName}`;
    const imageRef = ref(storage, storagePath);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= MAX_PHOTOS) return alert(`Max ${MAX_PHOTOS} photos`);
    setIsLoading(true);
    try {
      const fileURL = await uploadPhotoToFirebase(file);
      setPhotos((prevPhotos) => [...prevPhotos, fileURL]);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "user";
    input.onchange = handlePhotoUpload;
    input.click();
  };

  const handleGalleryUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = false;
    input.onchange = handlePhotoUpload;
    input.click();
  };

  const handleRemovePhoto = async (photoUrl, index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    if (!photoUrl.startsWith("https://firebasestorage.googleapis.com/")) return;
    if (!storage || !userId) return;
    try {
      const imageRef = ref(storage, photoUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  const handleSave = async () => {
    if (!db || !userId) return;
    if(!gender) return alert("Please Select Gender")
    setIsLoading(true);

    const profileData = {
      aboutMe,
      city,
      jobTitle,
      school,
      company,
      anthem,
      photos,
      smartPhotos,
      lookingFor, // Contains 'male' or 'female'
      pronouns,
      gender,
      height,
      relationshipType,
      languages,
      zodiac,
      education,
      familyPlans,
      personalityType,
      communicationStyle,
      loveStyle,
      pets,
      drinking,
      smoking,
      workout,
      diet,
      socialMedia,
      sleeping,
      prompts,
      interests,
      hideAge,
      hideDistance,
      lastUpdated: new Date().toISOString(),
    };

    try {
      const profileDocRef = doc(db, getUserDocPath(userId));
      await setDoc(profileDocRef, profileData, { merge: true });

      const userDocRef = doc(db, "users", userId);
      await setDoc(
        userDocRef,
        {
          photos,
          aboutMe,
          gender,
          lookingFor, // UPDATED: Added here so Discover page can filter users
          jobTitle,
          company,
          school,
          city,
          age: profile.age || "21",
          prompts,
          interests,
          height,
          education,
          drinking,
          smoking,
          zodiac,
          lastUpdated: new Date().toISOString(),
          isProfileCompleted: true, // --- THIS IS THE CRITICAL FIX ---
        },
        { merge: true }
      );

      setUserData((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...profileData },
      }));
      onNavigate("profile");
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isReadyToSave = !isLoading;

  return (
    <div className="bg-black min-h-screen">
      <div className="max-w-4xl mx-auto bg-black min-h-screen relative">
        <header className="border-b border-white/5 sticky top-16 lg:top-20 bg-black/80 backdrop-blur-xl z-20 transition-all duration-300 shadow-sm">
          <div className="flex justify-between items-center px-4 lg:px-8 py-4">
            <button
              onClick={() => onNavigate && onNavigate("profile")}
              className="p-2 -ml-2 hover:bg-zinc-800 cursor-pointer rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase">Edit Profile</h1>
            <button
              onClick={handleSave}
              className="text-base font-black cursor-pointer text-sky-400 hover:text-sky-300 disabled:text-zinc-700"
              disabled={!isReadyToSave || isLoading}
            >
              {isLoading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                "Done"
              )}
            </button>
          </div>
          <div className="flex px-4 lg:px-8">
            <button
              onClick={() => setActiveTab("edit")}
              className={`flex-1 py-3 text-center cursor-pointer font-black text-xs uppercase tracking-widest transition-colors relative ${
                activeTab === "edit" ? "text-sky-400" : "text-zinc-600"
              }`}
            >
              Edit{" "}
              {activeTab === "edit" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 py-3 text-center cursor-pointer font-black text-xs uppercase tracking-widest transition-colors relative ${
                activeTab === "preview" ? "text-sky-400" : "text-zinc-600"
              }`}
            >
              Preview{" "}
              {activeTab === "preview" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
              )}
            </button>
          </div>
        </header>

        {activeTab === "edit" ? (
          <main className="pb-32 bg-black px-4 lg:px-8 pt-4">
           {/* UPDATED: Increased margin-top (mt-24 for mobile, mt-10 for laptop) and removed the text title */}
<div className="p-5 bg-zinc-900 rounded-[2rem] border border-white/5 shadow-2xl mt-24 lg:mt-12">
  <div className=" grid grid-cols-3 gap-3 sm:grid-cols-6">
                {photos.slice(0, MAX_PHOTOS).map((photo, index) => (
                  <div
                    key={index}
                    className="relative bg-black rounded-2xl overflow-hidden border border-white/5"
                    style={{ aspectRatio: "3/4" }}
                  >
                    <img
                      src={photo}
                      alt={`Profile ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) =>
                        (e.target.src = `https://placehold.co/300x400/0c4a6e/e0f2fe?text=${
                          index + 1
                        }`)
                      }
                    />
                    <button
                      onClick={() => handleRemovePhoto(photo, index)}
                      className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-full p-1.5 hover:bg-black transition-colors shadow-md border border-white/10"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                {[...Array(MAX_PHOTOS - photos.length)].map((_, i) => (
                  <button
                    key={`empty-${photos.length + i}`}
                    onClick={() => setActiveModal("photoOptions")}
                    className="rounded-2xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-center hover:bg-zinc-700 transition-colors p-2"
                    style={{ aspectRatio: "3/4" }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader className="animate-spin w-6 h-6 text-sky-400" />
                    ) : (
                      <Plus className="w-6 h-6 text-sky-400" />
                    )}
                    <span className="text-[10px] font-black uppercase text-zinc-500 mt-2">
                      Add
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Smart Photos
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Tinder tests your photos to show your best one first.
                  </p>
                </div>
                <ToggleSwitch
                  initialChecked={smartPhotos}
                  onChange={setSmartPhotos}
                />
              </div>
            </div>

            <ProfileSection title="About Me" badge="Boosted">
              <div className="px-4 py-4">
                <button
                  onClick={() => setActiveModal("aboutMe")}
                  className="w-full bg-black/50 rounded-2xl p-4 border border-white/5 text-left hover:border-sky-500/50 transition-colors shadow-inner"
                >
                  {aboutMe ? (
                    <p className="text-sm text-zinc-200 truncate">{aboutMe}</p>
                  ) : (
                    <p className="text-sm text-zinc-600 italic font-bold">
                      Write something unique about yourself...
                    </p>
                  )}
                </button>
              </div>
              <div className="px-4 py-4 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-black text-white uppercase">
                    Prompts ({prompts.length}/3)
                  </p>
                  <button
                    onClick={() =>
                      prompts.length < 3 ? setActiveModal("prompts") : null
                    }
                    className={`bg-sky-500 text-black text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 active:scale-90 transition-all uppercase tracking-tighter ${
                      prompts.length < 3
                        ? ""
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    <Plus size={12} />
                    ADD PROMPT
                  </button>
                </div>
                {prompts.length > 0 ? (
                  <div className="space-y-3">
                    {prompts.map((prompt, idx) => (
                      <div
                        key={idx}
                        className="bg-black p-4 rounded-2xl border border-white/5 shadow-inner"
                      >
                        <p className="text-[10px] font-black text-sky-400 uppercase mb-1">
                          {prompt.question}
                        </p>
                        <p className="text-sm font-bold text-white">{prompt.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    Answer a question to share more about yourself.
                  </p>
                )}
              </div>
            </ProfileSection>

            <ProfileSection title="Interests" badge="+8% Matches">
              <div className="px-4 py-4">
                {interests.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {interests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full text-[10px] font-black border border-sky-500/20 uppercase tracking-tighter"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveModal("interests")}
                      className="w-full py-3 bg-zinc-800 text-sky-400 rounded-full font-black text-xs uppercase tracking-[0.2em] border border-sky-500/20"
                    >
                      Edit Interests
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-zinc-500 mb-3">
                      Let everyone know what you're into
                    </p>
                    <button
                      onClick={() => setActiveModal("interests")}
                      className="w-full bg-gradient-to-r from-sky-400 to-blue-600 text-black rounded-full py-3 font-black hover:opacity-90 shadow-lg transition"
                    >
                      Select Interests
                    </button>
                  </>
                )}
              </div>
            </ProfileSection>

            <ProfileSection title="Relationship Goals">
              <ListItem
                icon={Heart}
                title="Looking for"
                value={lookingFor}
                valueColor="text-yellow-500"
                onClick={() => setActiveModal("lookingFor")}
              />
              <ListItem
                icon={Heart}
                title="Open to"
                value={relationshipType}
                onClick={() => setActiveModal("relationshipType")}
              />
            </ProfileSection>

            <ProfileSection title="Basics">
              <ListItem
                icon={User}
                title="Pronouns"
                value={pronouns}
                onClick={() => setActiveModal("pronouns")}
              />
              <ListItem 
                icon={User} 
                title="Gender" 
                value={gender || "Select"} 
                onClick={() => setActiveModal('gender')} 
              />
              <ListItem
                icon={Ruler}
                title="Height"
                value={height}
                onClick={() => setActiveModal("height")}
              />
              <ListItem
                icon={BookOpen}
                title="Languages I Know"
                value={languages}
                onClick={() => setActiveModal("languages")}
              />
              <ListItem
                icon={Sprout}
                title="Zodiac"
                value={zodiac}
                onClick={() => setActiveModal("zodiac")}
              />
              <ListItem
                icon={GraduationCap}
                title="Education"
                value={education}
                onClick={() => setActiveModal("education")}
              />
              <ListItem
                icon={Users}
                title="Family Plans"
                value={familyPlans}
                onClick={() => setActiveModal("familyPlans")}
              />
            </ProfileSection>

            <ProfileSection title="Personality">
              <ListItem
                icon={User} 
                title="Personality Type"
                value={personalityType}
                onClick={() => setActiveModal("personalityType")}
              />
              <ListItem
                icon={MessageSquare}
                title="Communication Style"
                value={communicationStyle}
                onClick={() => setActiveModal("communicationStyle")}
              />
              <ListItem
                icon={Heart}
                title="Love Style"
                value={loveStyle}
                onClick={() => setActiveModal("loveStyle")}
              />
            </ProfileSection>

            <ProfileSection title="Lifestyle">
              <ListItem
                icon={Cat}
                title="Pets"
                value={pets}
                onClick={() => setActiveModal("pets")}
              />
              <ListItem
                icon={GlassWater}
                title="Drinking"
                value={drinking}
                onClick={() => setActiveModal("drinking")}
              />
              <ListItem
                icon={Cigarette}
                title="Smoking"
                value={smoking}
                onClick={() => setActiveModal("smoking")}
              />
              <ListItem
                icon={Dumbbell}
                title="Workout"
                value={workout}
                onClick={() => setActiveModal("workout")}
              />
              <ListItem
                icon={Utensils}
                title="Dietary Preference"
                value={diet}
                onClick={() => setActiveModal("diet")}
              />
              <ListItem
                icon={Moon}
                title="Sleeping Habits"
                value={sleeping}
                onClick={() => setActiveModal("sleeping")}
              />
              <ListItem
                icon={Music}
                title="Social Media"
                value={socialMedia}
                onClick={() => setActiveModal("socialMedia")}
              />
            </ProfileSection>

            <ProfileSection title="Work & Education">
              <ListItem
                icon={Briefcase}
                title="Job Title"
                value={jobTitle}
                onClick={() => setActiveModal("jobTitle")}
              />
              <ListItem
                icon={Building}
                title="Company"
                value={company}
                onClick={() => setActiveModal("company")}
              />
              <ListItem
                icon={School}
                title="School"
                value={school}
                onClick={() => setActiveModal("school")}
              />
              <ListItem
                icon={MapPin}
                title="Living In"
                value={city}
                onClick={() => setActiveModal("city")}
              />
              <ListItem
                icon={Mic}
                title="Anthem"
                value={anthem}
                onClick={() => setActiveModal("anthem")}
              />
            </ProfileSection>

            <ProfileSection title="Visibility">
              <div className="px-4 py-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <EyeOff className="text-zinc-600" />
                    <span className="text-white font-bold">Hide My Age</span>
                  </div>
                  <ToggleSwitch initialChecked={hideAge} onChange={setHideAge} />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <EyeOff className="text-zinc-600" />
                    <span className="text-white font-bold">Hide My Distance</span>
                  </div>
                  <ToggleSwitch initialChecked={hideDistance} onChange={setHideDistance} />
                </div>
              </div>
            </ProfileSection>
          </main>
        ) : (
          <PreviewProfile
            profileData={{
              photos,
              aboutMe,
              prompts,
              interests,
              lookingFor,
              height,
              jobTitle,
              city,
              age: profile.age,
            }}
          />
        )}

        {/* --- MODAL RENDERING LOGIC --- */}
        {activeModal === "aboutMe" && (
          <TextInputModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            title="About Me"
            value={aboutMe}
            onSave={setAboutMe}
            placeholder="Write something about yourself..."
            maxLength={300}
          />
        )}
        {activeModal === "jobTitle" && (
            <TextInputModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Job Title"
              value={jobTitle}
              onSave={setJobTitle}
              placeholder="What do you do?"
              maxLength={50}
            />
        )}
        {activeModal === "company" && (
            <TextInputModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Company"
              value={company}
              onSave={setCompany}
              placeholder="Where do you work?"
              maxLength={50}
            />
        )}
        {activeModal === "school" && (
            <TextInputModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="School"
              value={school}
              onSave={setSchool}
              placeholder="Where did you study?"
              maxLength={50}
            />
        )}
        {activeModal === "city" && (
            <TextInputModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="City"
              value={city}
              onSave={setCity}
              placeholder="Where do you live?"
              maxLength={50}
            />
        )}
        {activeModal === "anthem" && (
            <TextInputModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Anthem"
              value={anthem}
              onSave={setAnthem}
              placeholder="Pick an anthem..."
              maxLength={50}
            />
        )}

        {activeModal === "lookingFor" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Looking For"
              options={lookingForOptions}
              selectedValue={lookingFor}
              onSelect={setLookingFor}
            />
        )}
        {activeModal === "relationshipType" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Open To"
              options={relationshipTypeOptions}
              selectedValue={relationshipType}
              onSelect={setRelationshipType}
              allowMultiple={true}
            />
        )}
        {activeModal === "pronouns" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Pronouns"
              options={pronounOptions}
              selectedValue={pronouns}
              onSelect={setPronouns}
            />
        )}
        {activeModal === "gender" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Gender"
              options={genderOptions}
              selectedValue={gender}
              onSelect={setGender}
            />
        )}
        {activeModal === "height" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Height"
              options={heightOptions}
              selectedValue={height}
              onSelect={setHeight}
            />
        )}
        {activeModal === "languages" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Languages"
              options={languageOptions}
              selectedValue={languages}
              onSelect={setLanguages}
              allowMultiple={true}
            />
        )}
        {activeModal === "zodiac" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Zodiac"
              options={zodiacOptions}
              selectedValue={zodiac}
              onSelect={setZodiac}
            />
        )}
        {activeModal === "education" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Education"
              options={educationOptions}
              selectedValue={education}
              onSelect={setEducation}
            />
        )}
        {activeModal === "familyPlans" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Family Plans"
              options={familyPlansOptions}
              selectedValue={familyPlans}
              onSelect={setFamilyPlans}
            />
        )}
        {activeModal === "personalityType" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Personality"
              options={personalityOptions}
              selectedValue={personalityType}
              onSelect={setPersonalityType}
            />
        )}
        {activeModal === "communicationStyle" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Communication"
              options={communicationOptions}
              selectedValue={communicationStyle}
              onSelect={setCommunicationStyle}
            />
        )}
        {activeModal === "loveStyle" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Love Style"
              options={loveStyleOptions}
              selectedValue={loveStyle}
              onSelect={setLoveStyle}
            />
        )}
        {activeModal === "pets" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Pets"
              options={petsOptions}
              selectedValue={pets}
              onSelect={setPets}
            />
        )}
        {activeModal === "drinking" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Drinking"
              options={drinkingOptions}
              selectedValue={drinking}
              onSelect={setDrinking}
            />
        )}
        {activeModal === "smoking" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Smoking"
              options={smokingOptions}
              selectedValue={smoking}
              onSelect={setSmoking}
            />
        )}
        {activeModal === "workout" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Workout"
              options={workoutOptions}
              selectedValue={workout}
              onSelect={setWorkout}
            />
        )}
        {activeModal === "diet" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Diet"
              options={dietOptions}
              selectedValue={diet}
              onSelect={setDiet}
            />
        )}
        {activeModal === "socialMedia" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Social Media"
              options={socialMediaOptions}
              selectedValue={socialMedia}
              onSelect={setSocialMedia}
            />
        )}
        {activeModal === "sleeping" && (
            <SelectModal
              isOpen={true}
              onClose={() => setActiveModal(null)}
              title="Sleeping Habits"
              options={sleepingOptions}
              selectedValue={sleeping}
              onSelect={setSleeping}
            />
        )}
        
        {/* Custom Modals */}
        <InterestsModal
          isOpen={activeModal === "interests"}
          onClose={() => setActiveModal(null)}
          selectedInterests={interests}
          onSave={setInterests}
        />
        
        <PromptsModal
            isOpen={activeModal === "prompts"}
            onClose={() => setActiveModal(null)}
            prompts={prompts}
            onSave={handleAddPrompt}
        />

        <PhotoOptionsModal
          isOpen={activeModal === "photoOptions"}
          onClose={() => setActiveModal(null)}
          onSelectCamera={handleCameraCapture}
          onSelectGallery={handleGalleryUpload}
        />

      </div>
    </div>
  );
}