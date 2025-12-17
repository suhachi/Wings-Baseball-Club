import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Download, Share, PlusSquare, ArrowUp, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { isIOS, isAndroid, isInAppBrowser } from '../../lib/utils/userAgent';

export const InstallPage: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [os, setOs] = useState<'ios' | 'android' | 'desktop'>('desktop');
    const [showManualGuide, setShowManualGuide] = useState(false);

    useEffect(() => {
        // Detect OS
        const isAndroidDevice = isAndroid();
        const isIOSDevice = isIOS();

        if (isIOSDevice) setOs('ios');
        else if (isAndroidDevice) setOs('android');
        else setOs('desktop');

        // Android KakaoTalk Redirect
        if (isAndroidDevice && /KAKAOTALK/i.test(navigator.userAgent)) {
            // Redirect to Chrome using Intent
            // Remove protocol (https://) from current URL for intent scheme
            const urlWithoutProtocol = window.location.href.replace(/^https?:\/\//, '');
            window.location.href = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;end`;
            return;
        }

        // Check if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        // Capture install prompt
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            console.log('Install prompt captured');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            setShowManualGuide(true);
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
    };

    if (isInstalled) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl max-w-sm w-full"
                >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Download className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">이미 설치되었습니다!</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        홈 화면에서 <strong>Wings Baseball</strong> 앱을 찾아 실행해주세요.
                    </p>
                    <Button
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                        onClick={() => window.location.href = '/'}
                    >
                        앱 열기
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center p-6 text-white font-sans">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-md w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-[32px] overflow-hidden shadow-2xl"
            >
                {/* Header Image / Logo Area */}
                <div className="bg-gray-100 dark:bg-gray-800 p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 p-2 overflow-hidden">
                        <img src="/wingslogo.jpg" alt="App Icon" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold">Wings Baseball Club</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">공식 커뮤니티 앱을 설치하세요</p>
                </div>

                <div className="p-6 space-y-6">
                    {isInAppBrowser() && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <strong className="block mb-1 font-bold">잠깐!</strong>
                                카카오톡/인스타 브라우저에서는 설치가 안 될 수 있어요.
                                <br />
                                <strong>다른 브라우저로 열기</strong>를 눌러주세요.
                            </div>
                        </div>
                    )}

                    {/* Android / Desktop Install Button */}
                    {(os === 'android' || os === 'desktop') && (
                        <div className="text-center space-y-4">
                            <Button
                                onClick={handleInstallClick}
                                className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-none animate-pulse"
                            >
                                <Download className="w-5 h-5 mr-2" />
                                앱 설치하기
                            </Button>

                            {!showManualGuide && (
                                <p className="text-xs text-gray-500">
                                    * 설치 버튼이 작동하지 않으면 브라우저 메뉴의 '앱 설치'를 이용해주세요.
                                </p>
                            )}

                            {/* Manual Install Guide for Android */}
                            {showManualGuide && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                                        <div className="text-sm">
                                            <strong>자동 설치가 준비되지 않았습니다.</strong><br />
                                            브라우저 메뉴를 통해 직접 설치해주세요.
                                        </div>
                                    </div>
                                    <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-300 ml-1">
                                        <li className="flex items-center gap-2">
                                            <span className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                            우측 상단의 <strong>메뉴(⋮)</strong> 버튼 클릭
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                            <strong>'앱 설치'</strong> 또는 <strong>'홈 화면에 추가'</strong> 선택
                                        </li>
                                    </ol>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* iOS Instructions */}
                    {os === 'ios' && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <p className="font-bold text-lg mb-2">아이폰 설치 방법</p>
                                <p className="text-sm text-gray-500">
                                    사파리(Safari) 브라우저에서 아래 순서대로 진행해주세요.
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                                    <div className="text-sm flex-1">
                                        하단의 <strong className="text-blue-600">공유 버튼</strong> <Share className="w-4 h-4 inline mx-1" /> 을 누르세요.
                                    </div>
                                </div>
                                <div className="h-px bg-gray-200 dark:bg-gray-700" />
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                                    <div className="text-sm flex-1">
                                        메뉴에서 <strong className="text-blue-600">홈 화면에 추가</strong> <PlusSquare className="w-4 h-4 inline mx-1" /> 를 선택하세요.
                                    </div>
                                </div>
                                <div className="h-px bg-gray-200 dark:bg-gray-700" />
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                                    <div className="text-sm flex-1">
                                        오른쪽 상단의 <strong className="text-blue-600">추가</strong> 버튼을 누르면 설치 완료!
                                    </div>
                                </div>
                            </div>

                            {/* Arrow pointing to bottom (simulation) */}
                            <div className="flex justify-center pt-2 animate-bounce">
                                <ArrowUp className="w-6 h-6 text-blue-500 rotate-180" />
                            </div>
                        </div>
                    )}
                </div>
            </motion.div >

            <div className="mt-8 text-white/60 text-xs">
                © 2025 Wings Baseball Club
            </div>
        </div >
    );
};
