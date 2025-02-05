from typing import Dict
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Firebase Admin SDKの初期化
if os.getenv('K_SERVICE'):
    # Cloud Run 環境では、デフォルトの認証情報を使用
    firebase_admin.initialize_app()
else:
    # ローカル開発環境では、credentials.json を使用
    cred = credentials.Certificate('firebase-credentials.json')
    firebase_admin.initialize_app(cred)

db = firestore.client()

def get_user_level(user_id: str) -> Dict[str, any]:
    """
    ユーザーの現在の学習レベルと進捗状況を取得します。

    Args:
        user_id: ユーザーの識別子

    Returns:
        Dict with user's current level information
    """
    doc_ref = db.collection('users').document(user_id)
    doc = doc_ref.get()

    if not doc.exists:
        # ユーザーが存在しない場合はデフォルト値を返す
        return {
            "name": "ゲスト",
            "current_level": 1,
        }

    user_data = doc.to_dict()
    return {
        "name": user_data.get("name", "ゲスト"),
        "current_level": user_data.get("current_level", 1),
    }

def set_user_name(user_id: str, name: str) -> Dict[str, str]:
    """
    ユーザーの名前を設定します。

    Args:
        user_id: ユーザーの識別子
        name: ユーザーの名前

    Returns:
        Dict with user name information
    """
    doc_ref = db.collection('users').document(user_id)
    doc_ref.set({
        'name': name,
        'current_level': 1,
    }, merge=True)

    return {
        "name": name,
        "current_level": 1,
    }
