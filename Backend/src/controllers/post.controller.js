import prisma from '../db.js';

export const getFeed = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedPosts = posts.map((post) => {
      const likesCount = post.likes.length;
      const commentsCount = post.comments.length;
      const hasLiked = post.likes.some((like) => like.userId === currentUserId);
      
      return {
        ...post,
        likesCount,
        commentsCount,
        hasLiked,
        likes: undefined,
      };
    });

    res.json(formattedPosts);
  } catch (error) {
    console.error('Fetch feed error:', error);
    res.status(500).json({ error: 'Failed to fetch post feed' });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Post content cannot be empty' });
    }

    const post = await prisma.post.create({
      data: {
        content,
        imageUrl: imageUrl || null,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        comments: true,
        likes: true,
      },
    });

    res.status(201).json({
      ...post,
      likesCount: 0,
      commentsCount: 0,
      hasLiked: false,
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.userId;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post' });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.userId;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    let liked = false;
    if (existingLike) {
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
    } else {
      await prisma.like.create({
        data: {
          postId,
          userId,
        },
      });
      liked = true;
    }

    const likesCount = await prisma.like.count({
      where: { postId },
    });

    res.json({ liked, likesCount });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

export const addComment = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user.userId;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: true,
      },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== userId && comment.post.userId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment' });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};
