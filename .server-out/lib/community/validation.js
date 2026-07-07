"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePost = validatePost;
exports.validateComment = validateComment;
function validatePost(title, body) {
    const t = title.trim();
    const b = body.trim();
    if (t.length < 3)
        return 'Title must be at least 3 characters.';
    if (t.length > 300)
        return 'Title must be 300 characters or fewer.';
    if (b.length < 1)
        return 'Body cannot be empty.';
    if (b.length > 50000)
        return 'Body must be 50,000 characters or fewer.';
    return null;
}
function validateComment(body) {
    const b = body.trim();
    if (b.length < 1)
        return 'Comment cannot be empty.';
    if (b.length > 10000)
        return 'Comment must be 10,000 characters or fewer.';
    return null;
}
