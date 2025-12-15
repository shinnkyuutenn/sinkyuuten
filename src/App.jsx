// ライブラリとコンポーネントのインポート
import { useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

// 画像とアイコンのインポート
import heroImg from './assets/images/ui/Top Banner.jpg';
import mumbaiImg from './assets/images/ui/Mumbai.jpg';
import hyderabadImg from './assets/images/ui/Hyderabad.jpg';
import delhiImg from './assets/images/ui/New Delhi.jpg';
import signupBg from './assets/images/ui/signup_bg.jpg';
import spiceBg from './assets/images/ui/spice_bg.jpg';
import cleanlinessBg from './assets/images/ui/cleanliness_bg.jpg';
import comfortBg from './assets/images/ui/comfort_bg.jpg';
import crowdBg from './assets/images/ui/crowd_bg.jpg';
import searchIcon from './assets/icons/search_icon.png';
import lockIcon from './assets/icons/lock_icon_1.png';
import homeIcon from './assets/icons/home_icon_3.png';
import mapIcon from './assets/icons/map_icon_3.png';
import favoriteIcon from './assets/icons/favorite_icon_4.png';
import profileIcon from './assets/icons/profile_icon_3.png';
import spiceIcon from './assets/icons/spice_icon_1.png';
import spiceIconActive from './assets/icons/spice_icon_2.png';
import cleanlinessIcon from './assets/icons/cleanliness_icon_1.png';
import cleanlinessIconActive from './assets/icons/cleanliness_icon_2.png';
import comfortIcon from './assets/icons/comfort_icon_1.png';
import comfortIconActive from './assets/icons/comfort_icon_2.png';
import crowdIcon from './assets/icons/crowd_icon_1.png';
import crowdIconActive from './assets/icons/crowd_icon_2.png';
import restaurantIcon from './assets/icons/restaurant_icon_1.png';
import hotelIcon from './assets/icons/hotel_icon_1.png';
import spotIcon from './assets/icons/spot_icon_1.png';
import tripadvisorIcon from './assets/icons/tripadvisor_icon_1.png';

// 都市カードデータ
const cityCards = [
  { id: 'bombay', title: 'Bombay', image: mumbaiImg },
  { id: 'hyderabad', title: 'Hyderabad', image: delhiImg },
];

// ロックされたセクション
const lockedSections = [
  { id: 'personal', title: 'あなたの感性にあった口コミ' },
  { id: 'latest', title: '最新の口コミ' },
  { id: 'article', title: '自作記事' },
];

// メニュー項目
const menuItems = [
  { id: 'home', label: 'ホーム', icon: homeIcon },
  { id: 'map', label: 'マップ', icon: mapIcon },
  { id: 'favorites', label: 'お気に入り', icon: favoriteIcon },
  { id: 'profile', label: '個人情報', icon: profileIcon },
];

// フィルターカテゴリ
const filterCategories = [
  { id: 'spiciness', label: '辛さ', icon: spiceIcon, activeIcon: spiceIconActive, max: 5 },
  { id: 'cleanliness', label: '清潔度', icon: cleanlinessIcon, activeIcon: cleanlinessIconActive, max: 5 },
  { id: 'comfort', label: '快適度', icon: comfortIcon, activeIcon: comfortIconActive, max: 5 },
  { id: 'crowd', label: '混雑度', icon: crowdIcon, activeIcon: crowdIconActive, max: 5 },
];

// 場所の種類　　ここ日本語に変更した
const placeTypes = [
  { id: '飲食店', label: '飲食店' },
  { id: 'ホテル', label: 'ホテル' },
  { id: 'スポット', label: 'スポット' },
];


// 都市リスト
const cities = [
  { id: 'hyderabad', name: 'ハイデラバード' },
  { id: 'mumbai', name: 'ムンバイ' },
  { id: 'delhi', name: 'ニューデリー' },
];

// 都市の座標
const cityLocations = {
  hyderabad: { lat: 17.385044, lng: 78.486671 },
  mumbai: { lat: 19.076090, lng: 72.877426 },
  bombay: { lat: 19.076090, lng: 72.877426 },
};

// フィルターパネルコンポーネント
function FilterPanel({ isOpen, onClose, filters, onFilterChange, selectedCity, onCitySelect, isCitySelectOpen, setIsCitySelectOpen, selectedType, setSelectedType, onSearch }) {
  if (!isOpen) return null;

  // フィルター項目のレンダリング
  const renderFilterItem = (category) => {
    const isActive = filters[category.id] > 0;
    return (
      <div className={`flex-1 rounded-lg p-3 flex flex-col gap-2 transition-colors ${isActive ? 'bg-violet-500' : 'bg-gray-200'}`}>
        <div className="flex items-center gap-2">
          <img src={isActive ? category.activeIcon : category.icon} alt={category.label} className="h-5 w-5 object-contain" />
          <span className={`text-xs transition-colors ${isActive ? 'text-white' : 'text-gray-600'}`}>{category.label}</span>
          <span className={`font-medium text-lg transition-colors ml-auto ${isActive ? 'text-white' : 'text-gray-600'}`}>{filters[category.id]}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max={category.max} 
          value={filters[category.id]} 
          onChange={(e) => onFilterChange(category.id, parseInt(e.target.value))} 
          className="w-full" 
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors" 
          aria-label="閉じる"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4L16 16M16 4L4 16" />
          </svg>
        </button>
        <h2 className="text-center font-bold text-base text-slate-900">辛さ、清潔度、快適度、混雑度から探す</h2>

        <div className="space-y-3">
          {filterCategories.map((category, index) => {
            if (index % 2 === 0) {
              const nextCategory = filterCategories[index + 1];
              return (
                <div key={category.id} className="flex gap-3">
                  {renderFilterItem(category)}
                  {nextCategory && renderFilterItem(nextCategory)}
                </div>
              );
            }
            return null;
          })}
        </div>

        <div className="relative">
          <button onClick={() => setIsCitySelectOpen(!isCitySelectOpen)} className={`w-full rounded-lg py-3 px-5 font-medium text-center text-sm transition-colors ${selectedCity ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {selectedCity ? selectedCity.name : '都市'}
          </button>
          {isCitySelectOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
              {cities.map((city) => (
                <button key={city.id} onClick={() => onCitySelect(city)} className={`w-full py-3 px-5 text-sm text-left transition-colors ${selectedCity?.id === city.id ? 'bg-violet-100 text-violet-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                  {city.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {placeTypes.map((type) => (
            <button key={type.id} onClick={() => setSelectedType(type.id)} className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 px-4 transition-colors ${selectedType === type.id ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              <img src={type.icon} alt={type.label} className={`h-4 w-4 ${selectedType === type.id ? 'brightness-0 invert' : ''}`} />
              <span className="text-xs font-medium">{type.label}</span>
            </button>
          ))}
        </div>
        
        {/* 書き換えた */}
        <button
          onClick={() => {
            onSearch();
            onClose();
          }}
          className="w-full bg-violet-500 text-white font-semibold py-3 rounded-full shadow-lg hover:bg-violet-600 transition-colors"
        >
          お店を検索する
        </button>

      </div>
    </div>
  );
}

// サイドメニューコンポーネント
function SideMenu({ isOpen, onClose, onNavigate }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-64 bg-violet-400/95 backdrop-blur-sm shadow-2xl z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ borderTopLeftRadius: '24px', borderBottomLeftRadius: '24px' }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-white hover:bg-white/20 rounded-full p-2 transition-colors" aria-label="閉じる">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4L16 16M16 4L4 16" />
          </svg>
        </button>
        <nav className="pt-20 px-6">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={item.id}>
                <button onClick={() => onNavigate(item.id)} className="w-full flex items-center gap-4 text-white py-4 px-2 hover:bg-white/10 rounded-lg transition-colors">
                  <img src={item.icon} alt={item.label} className="h-6 w-6" />
                  <span className="text-base font-medium">{item.label}</span>
                </button>
                {index < menuItems.length - 1 && <div className="h-px bg-white/30 my-1" />}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

function App() {
  // Google Maps API読み込み
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCf_VRFHEmNuNbfalEifqsiVwJ21sasdtg',
    language: 'ja',
  });

  // ▼ 既存の useState 群の近くに追加
  const [keyword, setKeyword] = useState('');
  const [shops, setShops] = useState([]);


  // ページ状態
  const [currentPage, setCurrentPage] = useState('home');
  const [previousPage, setPreviousPage] = useState('home');
  
  // 地図状態
  const [mapLocation, setMapLocation] = useState({ lat: 17.385044, lng: 78.486671 });
  
  // UI状態
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCitySelectOpen, setIsCitySelectOpen] = useState(false);
  const [isUrlSubmitOpen, setIsUrlSubmitOpen] = useState(false);
  
  // フィルター状態
  const [restaurantUrl, setRestaurantUrl] = useState('');
  const [selectedType, setSelectedType] = useState('restaurant');
  const [selectedCity, setSelectedCity] = useState(null);
  const [filters, setFilters] = useState({
    spiciness: 0,
    cleanliness: 0,
    comfort: 0,
    crowd: 0,
  });
  
  // ユーザー状態
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    spiceTolerance: null,
    cleanliness: null,
    comfort: null,
    crowd: null,
  });
  
  // 登録フォーム状態
  const [signupForm, setSignupForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  // フィルター変更
  const handleFilterChange = (id, value) => setFilters(prev => ({ ...prev, [id]: value }));
  
  // 都市選択
  const handleCitySelect = (city) => { setSelectedCity(city); setIsCitySelectOpen(false); };
  
  // フィルターリセット
  const resetFilters = () => {
    setFilters({ spiciness: 0, cleanliness: 0, comfort: 0, crowd: 0 });
    setSelectedCity(null);
    setSelectedType('restaurant');
    setIsCitySelectOpen(false);
  };
  
  // フィルターパネル閉じる
  const handleCloseFilter = () => { setIsFilterOpen(false); resetFilters(); };

  // お店検索　これ追加した！
  const searchShops = async () => {
    try {
      const params = new URLSearchParams({
        keyword,
        shop_type: selectedType || '',
        city: selectedCity?.id || '',
        min_spicy: filters.spiciness,
        min_clean: filters.cleanliness,
        min_comfort: filters.comfort,
        min_congestion: filters.crowd,
      });

      const res = await fetch(`http://localhost:5000/search_shops_json?${params}`);
      const data = await res.json();
      setShops(data);

      // いまは確認用
      console.log('検索結果:', data);
    } catch (e) {
      console.error('検索失敗', e);
    }
  };

  
  // メニューナビゲーション
  const handleMenuNavigate = (pageId) => {
    if (pageId === 'home' || pageId === 'map') {
      setCurrentPage(pageId);
    } else if (pageId === 'profile' && !isLoggedIn) {
      setPreviousPage(currentPage);
      setCurrentPage('login');
    }
    setIsMenuOpen(false);
  };
  
  // 現在の都市取得
  const getCurrentCity = () => {
    if (Math.abs(mapLocation.lat - 17.385044) < 0.01) return 'Hyderabad';
    if (Math.abs(mapLocation.lat - 19.076090) < 0.01) return 'Mumbai';
    return 'Hyderabad';
  };
  
  // パスワード変更
  const handlePasswordChange = (value) => {
    setSignupForm(prev => ({ ...prev, password: value }));
    if (signupForm.confirmPassword) {
      setPasswordError(value !== signupForm.confirmPassword ? 'パスワードが一致しません' : '');
    }
  };
  
  // パスワード確認変更
  const handleConfirmPasswordChange = (value) => {
    setSignupForm(prev => ({ ...prev, confirmPassword: value }));
    setPasswordError(value !== signupForm.password ? 'パスワードが一致しません' : '');
  };
  
  // 登録送信
  const handleSignupSubmit = () => {
    if (signupForm.password !== signupForm.confirmPassword) {
      setPasswordError('パスワードが一致しません');
      return;
    }
    if (!signupForm.password) {
      setPasswordError('パスワードを入力してください');
      return;
    }
    setPasswordError('');
    setCurrentPage('home');
  };

  // ログインページ
  if (currentPage === 'login') {
    return (
      <main className="bg-white font-inter text-slate-900">
        <div className="mx-auto max-w-md">
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <button onClick={() => setCurrentPage(previousPage)} className="p-2" aria-label="戻る">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="flex-1 text-center text-lg font-semibold text-slate-900">ログイン</h1>
            <div className="w-10"></div>
          </div>
          <div className="h-[29vh] bg-cover bg-center" style={{ backgroundImage: `url(${signupBg})` }} />
          <div className="px-8 pt-8 space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">ユーザー名またはメールアドレス</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">パスワード</label>
              <input type="password" className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div className="!mt-16">
              <button className="w-full py-3 bg-violet-500 text-white font-semibold rounded-full shadow-lg hover:bg-violet-600 transition-colors">登録</button>
            </div>
            <div className="flex flex-col items-center space-y-3 pt-4 pb-12">
              <button onClick={() => setCurrentPage('signup')} className="text-sm text-violet-400 hover:text-violet-600">新規登録</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 新規登録ページ
  if (currentPage === 'signup') {
    const PreferenceSelector = ({ title, bgImage, levels, prefKey }) => (
      <div className="space-y-3">
        <div className="relative rounded-xl bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url(${bgImage})` }}>
          <div className="relative py-8">
            <h3 className="text-center text-2xl font-extrabold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5), -1px -1px 2px rgba(0,0,0,0.3)' }}>{title}</h3>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between gap-2">
            {levels.buttons.map(({ level, color }) => (
              <button key={level} onClick={() => setUserPreferences(prev => ({ ...prev, [prefKey]: level }))} className={`flex-1 h-12 rounded-lg shadow-md flex items-center justify-center font-bold text-white text-base transition-all ${userPreferences[prefKey] === level ? color : 'bg-gray-300'}`}>{level}</button>
            ))}
          </div>
          <div className={`h-2 rounded-full ${levels.gradient}`}></div>
          <div className="flex justify-between text-[10px] text-slate-600 font-normal leading-tight">
            {levels.labels.map((label, i) => (
              <div key={i} className="w-1/5 text-center" dangerouslySetInnerHTML={{ __html: label }} />
            ))}
          </div>
        </div>
      </div>
    );

    return (
      <main className="bg-white font-inter text-slate-900">
        <div className="mx-auto max-w-md min-h-screen">
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <button onClick={() => setCurrentPage('login')} className="p-2" aria-label="戻る">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="flex-1 text-center text-lg font-semibold text-slate-900">新規登録</h1>
            <div className="w-10"></div>
          </div>
          <div className="px-8 py-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">ユーザー名</label>
              <input 
                type="text" 
                value={signupForm.username}
                onChange={(e) => setSignupForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">メールアドレス</label>
              <input 
                type="email" 
                value={signupForm.email}
                onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">パスワード</label>
              <input 
                type="password" 
                value={signupForm.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 focus:ring-violet-300" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">パスワード確認</label>
              <input 
                type="password" 
                value={signupForm.confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-violet-50 border-none focus:outline-none focus:ring-2 ${
                  passwordError ? 'focus:ring-red-300' : 'focus:ring-violet-300'
                }`}
              />
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            </div>
            
            <PreferenceSelector 
              title="あなたの辛さ耐性は？" 
              bgImage={spiceBg} 
              prefKey="spiceTolerance"
              levels={{
                buttons: [
                  { level: 1, color: 'bg-yellow-400' },
                  { level: 2, color: 'bg-orange-400' },
                  { level: 3, color: 'bg-orange-500' },
                  { level: 4, color: 'bg-red-500' },
                  { level: 5, color: 'bg-red-600' }
                ],
                gradient: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600',
                labels: ['辛い無理<br/>0SHU', 'パプリカ程度<br/>300SHU', 'カイエン程度<br/>1500SHU', 'タバスコ程度<br/>5000SHU', '赤唐辛子程度<br/>25000SHU']
              }}
            />

            <PreferenceSelector 
              title="あなたの清潔重視度は？" 
              bgImage={cleanlinessBg} 
              prefKey="cleanliness"
              levels={{
                buttons: [
                  { level: 1, color: 'bg-cyan-300' },
                  { level: 2, color: 'bg-sky-400' },
                  { level: 3, color: 'bg-blue-500' },
                  { level: 4, color: 'bg-blue-600' },
                  { level: 5, color: 'bg-blue-700' }
                ],
                gradient: 'bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-700',
                labels: ['汚れてても平気', '気分次第で掃除', '清潔だと気持ちいい', '触れる所は拭きたい', '常にピカピカ必須']
              }}
            />

            <PreferenceSelector 
              title="あなたの快適さ重視度は？" 
              bgImage={comfortBg} 
              prefKey="comfort"
              levels={{
                buttons: [
                  { level: 1, color: 'bg-lime-400' },
                  { level: 2, color: 'bg-green-400' },
                  { level: 3, color: 'bg-green-500' },
                  { level: 4, color: 'bg-green-600' },
                  { level: 5, color: 'bg-green-700' }
                ],
                gradient: 'bg-gradient-to-r from-lime-400 via-green-500 to-green-700',
                labels: ['不便でも平気', '気分で整える', '快適だと嬉しい', '快適さは必須', '常に最適必須']
              }}
            />

            <PreferenceSelector 
              title="あなたの混雑苦手度は？" 
              bgImage={crowdBg} 
              prefKey="crowd"
              levels={{
                buttons: [
                  { level: 1, color: 'bg-amber-200' },
                  { level: 2, color: 'bg-amber-400' },
                  { level: 3, color: 'bg-yellow-600' },
                  { level: 4, color: 'bg-amber-700' },
                  { level: 5, color: 'bg-amber-900' }
                ],
                gradient: 'bg-gradient-to-r from-amber-200 via-yellow-600 to-amber-900',
                labels: ['混んでも平気', 'ちょい混みOK', '適度なら大丈夫', '人多いとしんどい', '混雑は無理']
              }}
            />

            <div className="pt-6 pb-12">
              <button 
                onClick={handleSignupSubmit}
                className="w-full py-3 bg-violet-500 text-white font-semibold rounded-full shadow-lg hover:bg-violet-600 transition-colors"
              >
                ユーザー登録
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // マップページ
  if (currentPage === 'map') {
    return (
      <main className="min-h-screen bg-white font-inter text-slate-900">
        <div className="mx-auto max-w-md min-h-screen flex flex-col relative">
          <div className="absolute top-32 inset-x-0 flex justify-center px-6 z-20">
            <div onClick={() => setIsFilterOpen(true)} className="flex w-full max-w-[280px] items-center gap-3 rounded-full bg-white px-5 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.15)] cursor-pointer">
              {/* 書き換えた */}
              <input
                type="text"
                placeholder="エリア・スポットを検索"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-1 border-none bg-transparent text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none"
              />
              <img src={searchIcon} alt="Search" className="h-5 w-5 opacity-60" />
            </div>
          </div>

          <button onClick={() => { setPreviousPage('map'); setCurrentPage('login'); }} className="absolute top-8 left-6 z-20 rounded-md bg-white/90 px-5 py-1 text-sm font-semibold text-violet-500 shadow-lg shadow-violet-500/30">
            ログイン
          </button>

          <button onClick={() => setIsMenuOpen(true)} className="absolute top-8 right-6 z-20 rounded-md bg-violet-500 p-4 text-white shadow-lg hover:bg-violet-600 transition-colors" aria-label="メニュー">
            <div className="space-y-1.5">
              <span className="block h-[2.5px] w-4 rounded-full bg-white" />
              <span className="block h-[2.5px] w-6 rounded-full bg-white" />
              <span className="block h-[2.5px] w-4 rounded-full bg-white" />
            </div>
          </button>

          <div className="absolute inset-0">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapLocation}
                zoom={12}
                options={{
                  disableDefaultUI: true,
                  zoomControl: false,
                  mapTypeControl: false,
                  scaleControl: false,
                  streetViewControl: false,
                  rotateControl: false,
                  fullscreenControl: false,
                  clickableIcons: false,
                  gestureHandling: 'greedy',
                  styles: [
                    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
                    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
                    { featureType: "poi.park", elementType: "labels.text", stylers: [{ visibility: "off" }] },
                    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] }
                  ],
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">地図を読み込み中...</p>
              </div>
            )}
          </div>

          <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onNavigate={handleMenuNavigate} />
          
          {/* 書き換えた */}
          <FilterPanel
            isOpen={isFilterOpen}
            onClose={handleCloseFilter}
            filters={filters}
            onFilterChange={handleFilterChange}
            selectedCity={selectedCity}
            onCitySelect={handleCitySelect}
            isCitySelectOpen={isCitySelectOpen}
            setIsCitySelectOpen={setIsCitySelectOpen}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            onSearch={searchShops}   // ← 追加
          />

          <button onClick={() => setIsUrlSubmitOpen(true)} className="absolute bottom-40 right-6 z-20 bg-violet-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-violet-600 transition-colors" aria-label="スポット追加">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>

          {isUrlSubmitOpen && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={() => setIsUrlSubmitOpen(false)}>
              <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <a href={`https://www.tripadvisor.com/Search?q=${getCurrentCity()}`} target="_blank" rel="noopener noreferrer" className="bg-violet-500 px-6 py-4 flex items-center justify-between hover:bg-violet-600 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <img src={tripadvisorIcon} alt="TripAdvisor" className="w-8 h-8 object-contain" />
                    <h3 className="text-white font-bold text-lg">TripAdvisor site</h3>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsUrlSubmitOpen(false); }} className="text-white hover:bg-white/20 rounded-full p-1 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4L16 16M16 4L4 16" />
                    </svg>
                  </button>
                </a>
                <div className="p-6 space-y-6">
                  <p className="text-sm text-slate-700 leading-relaxed">気になるレストラン・ホテル・スポットを見つけてワクワクする詳細ページのURLを管理者さんにポイっと送ってくださいね!</p>
                  <input type="url" value={restaurantUrl} onChange={(e) => setRestaurantUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 focus:outline-none transition-colors" />
                  <button 
                    onClick={() => { 
                      console.log('URL送信:', restaurantUrl); 
                      alert('URL送信完了！'); 
                      setRestaurantUrl(''); 
                      setIsUrlSubmitOpen(false); 
                    }} 
                    className="w-full bg-violet-500 text-white font-semibold py-3 rounded-full shadow-lg hover:bg-violet-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                    URL送る
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ホームページ
  return (
    <main className="min-h-screen bg-white font-inter text-slate-900">
      <div className="mx-auto max-w-md relative">
        <header className="relative h-40 shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImg})` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-transparent" />
          <div className="relative flex items-start justify-between px-6 pt-8">
            <button onClick={() => { setPreviousPage('home'); setCurrentPage('login'); }} className="rounded-md bg-white/90 px-5 py-1 text-sm font-semibold text-violet-500 shadow-lg shadow-violet-500/30">ログイン</button>
            <button onClick={() => setIsMenuOpen(true)} className="rounded-md bg-violet-500 p-4 text-white shadow-lg hover:bg-violet-600 transition-colors" aria-label="メニュー">
              <div className="space-y-1.5">
                <span className="block h-[2.5px] w-4 rounded-full bg-white" />
                <span className="block h-[2.5px] w-6 rounded-full bg-white" />
                <span className="block h-[2.5px] w-4 rounded-full bg-white" />
              </div>
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-[-14px] flex justify-center px-6">
            <div onClick={() => setIsFilterOpen(true)} className="flex w-full max-w-[280px] items-center gap-3 rounded-full bg-white px-5 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.15)] cursor-pointer">
              {/* 書き換えた 　input*/}
              <input
                type="text"
                placeholder="エリア・スポットを検索"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-1 border-none bg-transparent text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none"
              />
              <img src={searchIcon} alt="Search" className="h-5 w-5 opacity-60" />
            </div>
          </div>
        </header>

        <div className="space-y-4 bg-white px-8 pb-10 pt-12">
          <div className="space-y-3">
            <div 
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => { 
                      setMapLocation({ lat: position.coords.latitude, lng: position.coords.longitude }); 
                      setCurrentPage('map'); 
                    },
                    () => { 
                      setMapLocation(cityLocations.hyderabad); 
                      setCurrentPage('map'); 
                    }
                  );
                } else {
                  setMapLocation(cityLocations.hyderabad);
                  setCurrentPage('map');
                }
              }} 
              className="h-40 rounded-xl bg-cover bg-center shadow-[0_18px_35px_rgba(15,23,42,0.15)] cursor-pointer hover:shadow-[0_20px_40px_rgba(15,23,42,0.2)] transition-shadow" 
              style={{ backgroundImage: `url(${hyderabadImg})` }}
            >
              <div className="flex h-full items-center justify-center rounded-3xl bg-black/35">
                <p className="text-lg font-semibold text-white tracking-widest">現在地周辺</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {cityCards.map((city) => (
              <article key={city.id} onClick={() => { setMapLocation(cityLocations[city.id] || cityLocations.hyderabad); setCurrentPage('map'); }} className="h-28 rounded-2xl bg-cover bg-center shadow-[0_12px_28px_rgba(15,23,42,0.12)] cursor-pointer hover:shadow-[0_14px_32px_rgba(15,23,42,0.16)] transition-shadow" style={{ backgroundImage: `url(${city.image})` }}>
                <div className="flex h-full items-end rounded-2xl bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-sm font-semibold text-white">{city.title}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="space-y-10">
            {lockedSections.map((section) => (
              <div key={section.id} className="space-y-3">
                <p className="text-sm font-medium text-slate-700">{section.title}</p>
                <button 
                  onClick={() => {
                    if (!isLoggedIn) {
                      setPreviousPage('home');
                      setCurrentPage('login');
                    }
                  }}
                  className="flex w-[60%] mx-auto items-center justify-center gap-2 rounded-full bg-violet-400 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(124,58,237,0.4)]"
                >
                  <img src={lockIcon} alt="Lock" className="h-4 w-4" />
                  <span className="font-medium">アカウント登録で表示</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onNavigate={handleMenuNavigate} />
        
        {/* 書き換えた */}
        <FilterPanel
          isOpen={isFilterOpen}
          onClose={handleCloseFilter}
          filters={filters}
          onFilterChange={handleFilterChange}
          selectedCity={selectedCity}
          onCitySelect={handleCitySelect}
          isCitySelectOpen={isCitySelectOpen}
          setIsCitySelectOpen={setIsCitySelectOpen}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          onSearch={searchShops}   // ← 追加
        />
      </div>

      <pre className="text-xs p-2 bg-slate-100 max-h-40 overflow-auto">
        {JSON.stringify(shops, null, 2)}
      </pre>
    </main>
  );
}

export default App;
