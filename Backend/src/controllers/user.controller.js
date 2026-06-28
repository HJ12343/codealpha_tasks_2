import prisma from '../db.js';

export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        posts: {
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
        },
        followers: {
          select: {
            followerId: true,
          },
        },
        following: {
          select: {
            followingId: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followersCount = user.followers.length;
    const followingCount = user.following.length;
    const isFollowing = user.followers.some((follow) => follow.followerId === currentUserId);

    const formattedPosts = user.posts.map((post) => {
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

    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      followersCount,
      followingCount,
      isFollowing,
      posts: formattedPosts,
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

export const toggleFollow = async (req, res) => {
  try {
    const followingId = parseInt(req.params.id);
    const followerId = req.user.userId;

    if (followingId === followerId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User to follow not found' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    let following = false;
    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
    } else {
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });
      following = true;
    }

    const followersCount = await prisma.follow.count({
      where: { followingId },
    });

    res.json({ following, followersCount });
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({ error: 'Failed to toggle follow' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const currentUserId = req.user.userId;

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
            NOT: { id: currentUserId },
          }
        : {
            NOT: { id: currentUserId },
          },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        followers: {
          select: {
            followerId: true,
          },
        },
      },
      take: 20,
    });

    const formattedUsers = users.map((u) => {
      const isFollowing = u.followers.some((f) => f.followerId === currentUserId);
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        followersCount: u.followers.length,
        isFollowing,
      };
    });

    res.json(formattedUsers);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to find users' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body;
    const userId = req.user.userId;

    if (name && name.trim() === '') {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        bio: bio !== undefined ? bio : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        avatarUrl: true,
        role: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
