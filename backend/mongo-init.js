// Initialize databases and collections
db = db.getSiblingDB('mern_auth');

// Create users_db collections
db.createCollection('users_db.users');

// Create posts_db collections  
db.createCollection('posts_db.posts');

// Create comments_db collections
db.createCollection('comments_db.comments');

print('MERN Auth databases initialized successfully!');