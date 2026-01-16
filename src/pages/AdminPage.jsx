import React, { useState } from 'react';
import { db, collection, getDocs, doc, writeBatch, deleteDoc } from '../lib/firebase'; // Added deleteDoc if needed, though batch used primarily
import { addVerificationData } from '../utils/seeder';

const AdminPage = ({ onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        if (passwordInput === "0901") {
            setIsAuthenticated(true);
        } else {
            alert("비밀번호가 올바르지 않습니다.");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md">
                    <h1 className="text-2xl font-bold text-white mb-6 text-center">관리자 접속</h1>
                    <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="관리자 비밀번호"
                        className="w-full p-4 bg-slate-700 text-white rounded-xl mb-4 border border-slate-600 focus:border-teal-500 focus:outline-none"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all"
                    >
                        접속하기
                    </button>
                    <button
                        type="button"
                        onClick={onBack}
                        className="w-full mt-4 py-2 text-slate-400 hover:text-white text-sm"
                    >
                        돌아가기
                    </button>
                </form>
            </div>
        );
    }

    // --- Helper Functions ---
    const deleteCollection = async (collectionName) => {
        const q = collection(db, collectionName);
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        const chunks = [];
        let currentBatch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach((docSnap) => {
            currentBatch.delete(doc(db, collectionName, docSnap.id));
            count++;
            if (count >= 400) {
                chunks.push(currentBatch.commit());
                currentBatch = writeBatch(db);
                count = 0;
            }
        });
        if (count > 0) chunks.push(currentBatch.commit());
        await Promise.all(chunks);
    };

    const batchInsert = async (collectionName, items) => {
        if (!items || items.length === 0) return;

        const chunks = [];
        let currentBatch = writeBatch(db);
        let count = 0;

        items.forEach((item) => {
            const ref = doc(db, collectionName, item.id);
            const { id, ...data } = item;
            currentBatch.set(ref, data);

            count++;
            if (count >= 400) {
                chunks.push(currentBatch.commit());
                currentBatch = writeBatch(db);
                count = 0;
            }
        });
        if (count > 0) chunks.push(currentBatch.commit());
        await Promise.all(chunks);
    };

    const batchDeleteDocs = async (collectionName, items) => {
        if (!items || items.length === 0) return;

        const chunks = [];
        let currentBatch = writeBatch(db);
        let count = 0;

        items.forEach((item) => {
            currentBatch.delete(doc(db, collectionName, item.id));
            count++;
            if (count >= 400) {
                chunks.push(currentBatch.commit());
                currentBatch = writeBatch(db);
                count = 0;
            }
        });
        if (count > 0) chunks.push(currentBatch.commit());
        await Promise.all(chunks);
    };


    // --- Backup Functionality ---
    const handleBackup = async () => {
        setIsLoading(true);
        setStatus("데이터를 수집 중입니다...");
        try {
            // 1. Fetch Users
            const usersSnap = await getDocs(collection(db, "users"));
            const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 2. Fetch Reviews
            const reviewsSnap = await getDocs(collection(db, "reviews"));
            const reviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 3. Create JSON
            const exportData = {
                metadata: {
                    version: "1.0",
                    exportDate: new Date().toISOString(),
                    counts: {
                        users: users.length,
                        reviews: reviews.length
                    }
                },
                users,
                reviews
            };

            // 4. Trigger Download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `sunsal_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setStatus(`백업 완료! (유저: ${users.length}, 리뷰: ${reviews.length})`);
        } catch (e) {
            console.error(e);
            setStatus(`백업 실패: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Restore Functionality ---
    const handleRestore = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm("⚠️ 경고: 정말로 복구하시겠습니까?\n\n현재 DB의 모든 데이터(유저, 리뷰)가 삭제되고 선택한 파일의 데이터로 덮어씌워집니다. 이 작업은 되돌릴 수 없습니다.")) {
            e.target.value = ""; // reset input
            return;
        }

        setIsLoading(true);
        setStatus("파일을 읽는 중...");

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importedData = JSON.parse(event.target.result);

                if (!importedData.users || !importedData.reviews) {
                    throw new Error("유효하지 않은 백업 파일 형식입니다. (users 또는 reviews 누락)");
                }

                setStatus("기존 데이터 삭제 중...");

                await deleteCollection("users");
                await deleteCollection("reviews");

                setStatus("데이터 복구 중 (Batch Insert)...");

                await batchInsert("users", importedData.users);
                await batchInsert("reviews", importedData.reviews);

                setStatus(`복구 완료! (유저: ${importedData.users.length}, 리뷰: ${importedData.reviews.length})`);
                alert("데이터 복구가 완료되었습니다. 페이지를 새로고침합니다.");
                window.location.reload();

            } catch (err) {
                console.error(err);
                setStatus(`복구 실패: ${err.message}`);
                alert(`오류 발생: ${err.message}`);
            } finally {
                setIsLoading(false);
                e.target.value = ""; // reset
            }
        };
        reader.readAsText(file);
    };

    // --- Clear All Functionality ---
    const handleClearAll = async () => {
        if (!window.confirm("⛔️ [최종 경고] 정말로 모든 데이터를 삭제하시겠습니까?\n\n이 작업은 DB의 모든 유저와 리뷰를 영구적으로 삭제합니다.\n백업 파일을 미리 다운로드 받았는지 확인해주세요.")) {
            return;
        }

        const confirmation = prompt("보안을 위해 관리자 비밀번호(PIN)를 입력해주세요.");
        if (confirmation !== "0901") {
            alert("비밀번호가 올바르지 않습니다. 삭제가 취소됩니다.");
            return;
        }

        setIsLoading(true);
        setStatus("데이터 전체 삭제 시작...");

        try {
            await deleteCollection("users");
            setStatus("유저 데이터 삭제 완료.");
            await deleteCollection("reviews");
            setStatus("리뷰 데이터 삭제 완료.");

            alert("모든 데이터가 삭제되었습니다. 깨끗한 상태로 리로드합니다.");
            window.location.reload();
        } catch (e) {
            console.error(e);
            setStatus(`삭제 실패: ${e.message}`);
            alert(`오류 발생: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Delete Dummy Users (Non-Admin) ---
    const handleDeleteDummyUsers = async () => {
        if (!window.confirm("⚠️ 위험: 관리자(개발자) 계정을 제외한 모든 '더미 유저'와 '그들의 리뷰'를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.")) {
            return;
        }

        const confirmation = prompt("보안을 위해 관리자 비밀번호(PIN)를 입력해주세요.");
        if (confirmation !== "0901") {
            alert("비밀번호가 올바르지 않습니다. 취소합니다.");
            return;
        }

        setIsLoading(true);
        setStatus("더미 데이터 식별 및 삭제 시작...");

        try {
            // 1. Fetch All Users
            const usersSnap = await getDocs(collection(db, "users"));
            const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 2. Identify Dummy Users (Strict Pattern Matching)
            const dummyUsers = allUsers.filter(u => {
                const isDummyPattern = u.id.startsWith("soonsal_user_") ||
                    u.id.startsWith("verifier_") ||
                    u.id.startsWith("mock_");
                return isDummyPattern;
            });

            if (dummyUsers.length === 0) {
                setStatus("삭제할 더미 유저가 없습니다.");
                alert("삭제할 더미 유저가 없습니다.");
                setIsLoading(false);
                return;
            }

            setStatus(`더미 유저 ${dummyUsers.length}명 발견. 삭제 중...`);

            // 3. Delete Dummy Users
            await batchDeleteDocs("users", dummyUsers);

            // 4. Delete Reviews from Dummy Users
            setStatus("리뷰 데이터 정리 중...");
            const reviewsSnap = await getDocs(collection(db, "reviews"));
            const allReviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            const dummyUserIds = new Set(dummyUsers.map(u => u.id));
            const dummyReviews = allReviews.filter(r => dummyUserIds.has(r.userId));

            if (dummyReviews.length > 0) {
                await batchDeleteDocs("reviews", dummyReviews);
            }

            setStatus(`삭제 완료! (유저: ${dummyUsers.length}명, 리뷰: ${dummyReviews.length}개)`);
            alert(`정리 완료!\n유저 ${dummyUsers.length}명과 리뷰 ${dummyReviews.length}개를 삭제했습니다.`);

        } catch (e) {
            console.error(e);
            setStatus(`삭제 실패: ${e.message}`);
            alert(`오류 발생: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500">
                            시스템 관리자 (Admin)
                        </h1>
                        <p className="text-slate-400 mt-2">
                            데이터 백업 및 복구를 수행합니다.
                        </p>
                    </div>
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                    >
                        메인으로 돌아가기
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Backup Section */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                        <h2 className="text-xl font-bold text-teal-400 mb-4 flex items-center gap-2">
                            📤 데이터 백업 (Export)
                        </h2>
                        <p className="text-slate-400 text-sm mb-6">
                            현재 데이터베이스(Firestore)의 모든 유저 정보와 리뷰 데이터를 JSON 파일로 다운로드합니다.
                        </p>
                        <button
                            onClick={handleBackup}
                            disabled={isLoading}
                            className={`w-full py-3 rounded-xl font-bold transition-all ${isLoading
                                ? "bg-slate-600 cursor-not-allowed"
                                : "bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-900/50"
                                }`}
                        >
                            {isLoading ? "처리 중..." : "전체 데이터 다운로드"}
                        </button>
                    </div>

                    {/* Restore Section */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-red-900/30 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 bg-red-600/20 text-red-400 text-xs font-bold rounded-bl-xl">
                            DANGER ZONE
                        </div>
                        <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                            📥 데이터 복구 (Restore)
                        </h2>
                        <p className="text-slate-400 text-sm mb-6">
                            백업 파일을 업로드하여 데이터를 복원합니다.
                            <br />
                            <strong className="text-red-400">주의: 기존 데이터는 모두 삭제됩니다.</strong>
                        </p>

                        <label className={`block w-full text-center py-3 rounded-xl font-bold transition-all cursor-pointer mb-4 ${isLoading
                            ? "bg-slate-600 cursor-not-allowed"
                            : "bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 hover:border-slate-500"
                            }`}>
                            <span>{isLoading ? "처리 중..." : "백업 파일 선택 (.json)"}</span>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleRestore}
                                disabled={isLoading}
                                className="hidden"
                            />
                        </label>

                        <div className="border-t border-slate-700 my-4 pt-4">
                            <h3 className="text-red-500 font-bold mb-2 text-sm">⛔️ 데이터 초기화</h3>
                            <button
                                onClick={handleClearAll}
                                disabled={isLoading}
                                className="w-full py-3 bg-red-900/50 hover:bg-red-900/80 text-red-200 border border-red-800 rounded-xl font-bold transition-all"
                            >
                                전체 데이터 삭제 (DB 초기화)
                            </button>
                        </div>

                        <div className="border-t border-slate-700 my-4 pt-4">
                            <h3 className="text-blue-400 font-bold mb-2 text-sm">🧪 테스트 데이터</h3>
                            <button
                                onClick={addVerificationData}
                                disabled={isLoading}
                                className="w-full py-3 bg-blue-900/50 hover:bg-blue-900/80 text-blue-200 border border-blue-800 rounded-xl font-bold transition-all"
                            >
                                검증용 데이터 추가 (Threshold Test)
                            </button>
                        </div>

                        <div className="border-t border-slate-700 my-4 pt-4">
                            <h3 className="text-orange-400 font-bold mb-2 text-sm">🧹 데이터 정리</h3>
                            <button
                                onClick={handleDeleteDummyUsers}
                                disabled={isLoading}
                                className="w-full py-3 bg-orange-900/50 hover:bg-orange-900/80 text-orange-200 border border-orange-800 rounded-xl font-bold transition-all"
                            >
                                더미 유저 삭제 (관리자 제외)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Log / Status Area */}
                <div className="mt-8 p-4 bg-black/50 rounded-xl font-mono text-sm h-32 overflow-y-auto border border-slate-800">
                    <span className="text-slate-500">{">"}</span> {status || "대기 중..."}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
