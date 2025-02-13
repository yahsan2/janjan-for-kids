import asyncio
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

def get_user_data(user_id: str) -> Dict[str, any]:
    """
    ユーザーの名前と、現在の学習レベルと学習状況を取得します。

    Args:
        user_id: ユーザーの識別子

    Returns:
        Dict with user's name and current level information and math questions
    """
    # ユーザー情報と問題を一度のクエリで取得
    user_ref = db.collection('users').document(user_id)
    questions_ref = user_ref.collection('mathQuestions')

    # トランザクションで一括取得
    @firestore.transactional
    def get_user_data_transaction(transaction):
        user_doc = user_ref.get(transaction=transaction)

        if not user_doc.exists:
            return None

        user_data = user_doc.to_dict()
        current_level = user_data.get('current_level', 1)

        # 現在のレベルの問題を取得
        questions = []
        # 現在のレベルと1つ前のレベルの問題を取得
        current_level_docs = questions_ref.where('level', '==', current_level).limit(1).get(transaction=transaction)
        previous_level_docs = questions_ref.where('level', '==', max(1, current_level - 1)).limit(1).get(transaction=transaction)
        question_docs = list(current_level_docs) + list(previous_level_docs)
        for doc in question_docs:
            question_data = doc.to_dict()
            question_data['id'] = doc.id
            # Remove timestamp fields
            if 'createdAt' in question_data:
                del question_data['createdAt']
            if 'updatedAt' in question_data:
                del question_data['updatedAt']
            questions.append(question_data)

        return {
            "name": user_data.get("name", "ゲスト"),
            "current_level": current_level,
            "questions": questions
        }

    # トランザクションを実行
    transaction = db.transaction()
    result = get_user_data_transaction(transaction)
    return result

def set_user_name(user_id: str, name: str) -> Dict[str, str]:
    """
    ユーザーの名前とレベルを設定保存します。

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

def add_math_question(user_id: str, question_text: str, formula: str, answer: str, level: int) -> bool:
    """
    新しい問題を追加します。

    Args:
        user_id: ユーザーの識別子
        question_text: 問題文（例：りんごが3個あって、そこにお友達から2個もらったら全部でいくつになるかな？）
        formula: 計算式（例：3 + 2 = ?）
        answer: 正解の答え
        level: 問題のレベル

    Returns:
        text: 何も返しません。
    """
    async def add_question():
        # 新しい問題のドキュメントを作成
        doc_ref = db.collection('users').document(user_id).collection('mathQuestions').document()
        data = {
            'questionText': question_text,
            'answer': answer,
            'level': level,
            'formula': formula,
            'correctCount': 0,
            'wrongCount': 0,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
        }
        doc_ref.set(data)
    asyncio.create_task(add_question())
    return

def upsert_math_question_result(user_id: str, question_id: str, is_correct: bool):
    """
    子供の回答を正解でも不正解でも記録する。

    Args:
        user_id: ユーザーの識別子
        question_id: 問題のID
        is_correct: 正解かどうか

    Returns:
        void: 何も返しません。
    """
    # 非同期で更新を実行し、レスポンスは先に返す
    async def update_question():
        doc_ref = db.collection('users').document(user_id).collection('mathQuestions').document(question_id)
        doc = doc_ref.get()
        if not doc.exists:
            return
        data = doc.to_dict()
        if is_correct:
            data['correctCount'] = data.get('correctCount', 0) + 1
        else:
            data['wrongCount'] = data.get('wrongCount', 0) + 1
        data['updatedAt'] = firestore.SERVER_TIMESTAMP

        doc_ref.update(data)

    asyncio.create_task(update_question())
    return


def get_math_question_stats(user_id: str, question_id: str) -> Dict[str, any]:
    """
    問題の統計情報を取得します。

    Args:
        user_id: ユーザーの識別子
        question_id: 問題のID

    Returns:
        Dict with question statistics and information
    """
    doc_ref = db.collection('users').document(user_id).collection('mathQuestions').document(question_id)
    doc = doc_ref.get()

    if not doc.exists:
        return {
            'questionText': '',
            'answer': '',
            'level': 1,
            'correctCount': 0,
            'wrongCount': 0,
        }

    data = doc.to_dict()
    return {
        'questionText': data.get('questionText', ''),
        'answer': data.get('answer', ''),
        'level': data.get('level', 1),
        'correctCount': data.get('correctCount', 0),
        'wrongCount': data.get('wrongCount', 0),
    }

def increment_user_level(user_id: str) -> Dict[str, any]:
    """
    ユーザーのレベルアップを保存

    Args:
        user_id: ユーザーの識別子

    Returns:
        Dict with updated user level information
    """
    doc_ref = db.collection('users').document(user_id)
    doc = doc_ref.get()

    if not doc.exists:
        # ユーザーが存在しない場合は新規作成してレベル2を設定
        data = {
            "name": "ゲスト",
            "current_level": 2,
        }
        doc_ref.set(data)
        return data

    user_data = doc.to_dict()
    new_level = user_data.get("current_level", 1) + 1

    update_data = {
        "current_level": new_level
    }
    doc_ref.update(update_data)

    return {
        "name": user_data.get("name", "ゲスト"),
        "current_level": new_level,
    }
