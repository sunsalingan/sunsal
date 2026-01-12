import React, { useState } from 'react';
import { db, collection, getDocs, doc, writeBatch } from '../lib/firebase';

const AdminPage = ({ onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("");

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

                // 1. Delete Existing Data (Batch)
                // Note: Firestore recommends deleting via Cloud Functions for large collections.
                // For client-side, we must query and delete.
                await deleteCollection("users");
                await deleteCollection("reviews");

                setStatus("데이터 복구 중 (Batch Insert)...");

                // 2. Insert New Data
                // Process in chunks of 500 (Firestore limit)
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

    // Helper: Delete Utility
    const deleteCollection = async (collectionName) => {
        const q = collection(db, collectionName);
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        // Chunking for deletion
        const chunks = [];
        let currentBatch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach((docSnap) => {
            currentBatch.delete(doc(db, collectionName, docSnap.id));
            count++;
            if (count >= 400) { // Safety margin < 500
                chunks.push(currentBatch.commit());
                currentBatch = writeBatch(db);
                count = 0;
            }
        });
        if (count > 0) chunks.push(currentBatch.commit());

        await Promise.all(chunks);
    };

    // Helper: Insert Utility
    const batchInsert = async (collectionName, items) => {
        if (!items || items.length === 0) return;

        const chunks = [];
        let currentBatch = writeBatch(db);
        let count = 0;

        items.forEach((item) => {
            const ref = doc(db, collectionName, item.id); // Use preserved ID
            // Exclude 'id' from data if spread, but doc() takes id separately.
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

                        <label className={`block w-full text-center py-3 rounded-xl font-bold transition-all cursor-pointer ${isLoading
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
