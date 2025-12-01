import { PrismaClient, type Media } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...')

  // Seed Categories
  console.log('📚 Đang tạo danh mục sách...')
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'kinh-doanh' },
      update: {},
      create: {
        name: 'Kinh Doanh',
        slug: 'kinh-doanh',
        description: 'Sách về kinh doanh, quản lý và khởi nghiệp'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'van-hoc' },
      update: {},
      create: {
        name: 'Văn Học',
        slug: 'van-hoc',
        description: 'Tiểu thuyết, truyện ngắn, thơ ca và văn học nghệ thuật'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'tu-phat-trien' },
      update: {},
      create: {
        name: 'Tự Phát Triển',
        slug: 'tu-phat-trien',
        description: 'Phát triển bản thân, kỹ năng sống và tư duy tích cực'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'lich-su' },
      update: {},
      create: {
        name: 'Lịch Sử',
        slug: 'lich-su',
        description: 'Sách về lịch sử, văn hóa và các sự kiện lịch sử'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'khoa-hoc' },
      update: {},
      create: {
        name: 'Khoa Học',
        slug: 'khoa-hoc',
        description: 'Khoa học tự nhiên, công nghệ và nghiên cứu'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'thieu-nhi' },
      update: {},
      create: {
        name: 'Thiếu Nhi',
        slug: 'thieu-nhi',
        description: 'Sách dành cho trẻ em và thanh thiếu niên'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'sach-hoc-ngoai-ngu' },
      update: {},
      create: {
        name: 'Sách Học Ngoại Ngữ',
        slug: 'sach-hoc-ngoai-ngu',
        description: 'Sách học tiếng Anh, tiếng Nhật và các ngôn ngữ khác'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'sach-giao-duc' },
      update: {},
      create: {
        name: 'Sách Giáo Dục',
        slug: 'sach-giao-duc',
        description: 'Sách giáo khoa, tham khảo và phương pháp học tập'
      }
    })
  ])

  console.log(`✅ Đã tạo ${categories.length} danh mục`)

  // Seed Authors
  console.log('👤 Đang tạo tác giả...')
  const authors = await Promise.all([
    prisma.author.upsert({
      where: { name: 'Dale Carnegie' },
      update: {},
      create: {
        name: 'Dale Carnegie',
        bio: 'Tác giả nổi tiếng với cuốn sách "Đắc Nhân Tâm", chuyên gia về giao tiếp và phát triển kỹ năng con người.',
        // imageId will be set to null - authors can add images later via MediaPicker
      }
    }),
    prisma.author.upsert({
      where: { name: 'Yuval Noah Harari' },
      update: {},
      create: {
        name: 'Yuval Noah Harari',
        bio: 'Nhà sử học người Israel, tác giả của bộ sách nổi tiếng về lịch sử loài người.',
        // imageId will be set to null - authors can add images later via MediaPicker
      }
    }),
    prisma.author.upsert({
      where: { name: 'Paulo Coelho' },
      update: {},
      create: {
        name: 'Paulo Coelho',
        bio: 'Nhà văn Brazil nổi tiếng với tác phẩm "Nhà Giả Kim", một trong những tác giả bán chạy nhất thế giới.',
        // imageId will be set to null - authors can add images later via MediaPicker
      }
    }),
    prisma.author.upsert({
      where: { name: 'Adam Khoo' },
      update: {},
      create: {
        name: 'Adam Khoo',
        bio: 'Chuyên gia giáo dục và phát triển bản thân người Singapore, tác giả của nhiều cuốn sách bán chạy.',
        // imageId will be set to null - authors can add images later via MediaPicker
      }
    }),
    prisma.author.upsert({
      where: { name: 'James Clear' },
      update: {},
      create: {
        name: 'James Clear',
        bio: 'Tác giả của "Atomic Habits", chuyên gia về phát triển thói quen và năng suất cá nhân.',
        // imageId will be set to null - authors can add images later via MediaPicker
      }
    }),
    prisma.author.upsert({
      where: { name: 'Daniel Kahneman' },
      update: {},
      create: {
        name: 'Daniel Kahneman',
        bio: 'Nhà tâm lý học đoạt giải Nobel Kinh tế, tác giả của "Tư Duy Nhanh và Chậm".',
        // imageId will be set to null - authors can add images later via MediaPicker
      }
    }),
    prisma.author.upsert({
      where: { name: 'Nguyễn Nhật Ánh' },
      update: {},
      create: {
        name: 'Nguyễn Nhật Ánh',
        bio: 'Nhà văn Việt Nam nổi tiếng với các tác phẩm viết cho thiếu nhi và tuổi mới lớn.',
        // imageId will be set to null - authors can add images later via MediaPicker
      }
    }),
    prisma.author.upsert({
      where: { name: 'Malcolm Gladwell' },
      update: {},
      create: {
        name: 'Malcolm Gladwell',
        bio: 'Nhà báo và tác giả nổi tiếng với các cuốn sách về tâm lý học và xã hội học.',
        // imageId will be set to null - authors can add images later via MediaPicker
      }
    }),
    prisma.author.upsert({
      where: { name: 'Robert Kiyosaki' },
      update: {},
      create: {
        name: 'Robert Kiyosaki',
        bio: 'Doanh nhân, nhà đầu tư và tác giả nổi tiếng với cuốn sách "Rich Dad Poor Dad".',
        // imageId will be set to null - authors can add images later via MediaPicker
      }
    }),
    prisma.author.upsert({
      where: { name: 'Eric Ries' },
      update: {},
      create: {
        name: 'Eric Ries',
        bio: 'Doanh nhân và tác giả của "The Lean Startup", chuyên gia về khởi nghiệp và đổi mới.',
        // imageId will be set to null - authors can add images later via MediaPicker
      }
    })
  ])

  console.log(`✅ Đã tạo ${authors.length} tác giả`)

  // Seed Publishers
  console.log('🏢 Đang tạo nhà xuất bản...')
  const publishers = await Promise.all([
    prisma.publisher.upsert({
      where: { name: 'Nhà Xuất Bản Trẻ' },
      update: {},
      create: {
        name: 'Nhà Xuất Bản Trẻ',
        address: '161B Lý Chính Thắng, Phường Võ Thị Sáu, Quận 3, TP.HCM',
        phone: '(028) 3932 2816',
        email: 'info@nxbtre.com.vn',
        website: 'https://www.nxbtre.com.vn'
      }
    }),
    prisma.publisher.upsert({
      where: { name: 'Alpha Books' },
      update: {},
      create: {
        name: 'Alpha Books',
        address: 'Số 4 ngõ 93 Láng Hạ, Đống Đa, Hà Nội',
        phone: '(024) 3513 2266',
        email: 'info@alphabooks.vn',
        website: 'https://www.alphabooks.vn'
      }
    }),
    prisma.publisher.upsert({
      where: { name: 'First News - Trí Việt' },
      update: {},
      create: {
        name: 'First News - Trí Việt',
        address: '11H Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP.HCM',
        phone: '(028) 3822 8833',
        email: 'firstnews@triviet.com',
        website: 'https://www.firstnews.com.vn'
      }
    }),
    prisma.publisher.upsert({
      where: { name: 'Nhà Xuất Bản Hội Nhà Văn' },
      update: {},
      create: {
        name: 'Nhà Xuất Bản Hội Nhà Văn',
        address: '65 Nguyễn Du, Hai Bà Trưng, Hà Nội',
        phone: '(024) 3822 1944',
        email: 'nxbhnv@vnn.vn',
        website: 'https://www.nxbhoinhvan.vn'
      }
    }),
    prisma.publisher.upsert({
      where: { name: 'Thái Hà Books' },
      update: {},
      create: {
        name: 'Thái Hà Books',
        address: '119 C5, Tô Hiệu, Cầu Giấy, Hà Nội',
        phone: '(024) 3792 0376',
        email: 'contact@thaihabooks.com',
        website: 'https://www.thaihabooks.com'
      }
    }),
    prisma.publisher.upsert({
      where: { name: 'Nhà Xuất Bản Kim Đồng' },
      update: {},
      create: {
        name: 'Nhà Xuất Bản Kim Đồng',
        address: '55 Quang Trung, Hai Bà Trưng, Hà Nội',
        phone: '(024) 3943 4741',
        email: 'info@nxbkimdong.com.vn',
        website: 'https://www.nxbkimdong.com.vn'
      }
    })
  ])

  console.log(`✅ Đã tạo ${publishers.length} nhà xuất bản`)

  // Seed Media (for book thumbnails and gallery)
  console.log('🖼️ Đang tạo media...')
  
  // Lấy hoặc tạo admin user để gán vào uploadedBy
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  })
  
  if (!adminUser) {
    // Nếu chưa có admin, tạo một admin tạm thời (sẽ dùng để seed media)
    adminUser = await prisma.user.create({
      data: {
        email: 'seed-admin@example.com',
        password: 'temp-password-will-be-updated',
        role: 'ADMIN',
        name: 'Seed Admin',
      },
    })
    console.log('⚠️  Đã tạo admin tạm thời cho seed. Vui lòng tạo admin thật bằng npm run create-admin')
  }

  const baseMediaUrl = '/media/2025/11/03/1762129478225-fvm5fa05cjn.webp'
  const baseMediaPath = 'media/2025/11/03/1762129478225-fvm5fa05cjn.webp'
  const mediaSize = 137390
  
  // Tạo 20 media records để sử dụng cho thumbnails và gallery
  // Sử dụng filename để identify thay vì ID tùy chỉnh (chuẩn hơn)
  const mediaConfigs = [
    { originalName: 'book-thumbnail-1.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-2.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-3.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-4.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-5.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-6.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-7.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-8.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-9.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-10.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-11.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-12.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-13.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-14.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-15.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-16.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-17.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-18.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-19.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
    { originalName: 'book-gallery-20.webp', filename: '1762129478225-fvm5fa05cjn.webp' },
  ]

  // Tạo media records - sử dụng filename + originalName để identify (không dùng ID tùy chỉnh)
  const mediaRecords: Media[] = []
  for (const config of mediaConfigs) {
    // Tìm media đã tồn tại dựa trên filename và originalName (hoặc tạo mới)
    const existingMedia = await prisma.media.findFirst({
      where: {
        filename: config.filename,
        originalName: config.originalName,
      },
    })

    let media
    if (existingMedia) {
      // Update nếu đã tồn tại
      media = await prisma.media.update({
        where: { id: existingMedia.id },
        data: {
          url: baseMediaUrl,
          path: baseMediaPath,
          size: mediaSize,
          uploadedBy: adminUser.id,
        },
      })
    } else {
      // Tạo mới - để Prisma tự generate ID (chuẩn)
      media = await prisma.media.create({
        data: {
          filename: config.filename,
          originalName: config.originalName,
          mimeType: 'image/webp',
          size: mediaSize,
          path: baseMediaPath,
          url: baseMediaUrl,
          uploadedBy: adminUser.id,
        },
      })
    }
    mediaRecords.push(media)
  }
  
  console.log(`✅ Đã tạo ${mediaRecords.length} media records`)

  // Seed Books
  console.log('📖 Đang tạo sách...')
  
  // Định nghĩa cấu hình cho từng sách (thumbnail và gallery media indices)
  const bookConfigs = [
    {
      isbn: '978-604-1-00001-1',
      title: 'Đắc Nhân Tâm',
      description: 'Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử. Đây là một trong những cuốn sách bán chạy nhất mọi thời đại, giúp bạn xây dựng mối quan hệ tốt đẹp với mọi người.',
      price: 89000,
      stock: 150,
      status: 'ACTIVE' as const,
      categorySlug: 'tu-phat-trien',
      authorName: 'Dale Carnegie',
      publisherName: 'Alpha Books',
      thumbnailMediaIndex: 0,
      galleryMediaIndices: [1, 2, 3],
    },
    {
      isbn: '978-604-1-00002-2',
      title: 'Sapiens: Lược Sử Loài Người',
      description: 'Câu chuyện về lịch sử và tương lai của loài người. Từ cách chúng ta tiến hóa đến cách chúng ta xây dựng các nền văn minh phức tạp.',
      price: 199000,
      stock: 80,
      status: 'ACTIVE' as const,
      categorySlug: 'lich-su',
      authorName: 'Yuval Noah Harari',
      publisherName: 'First News - Trí Việt',
      thumbnailMediaIndex: 1,
      galleryMediaIndices: [2, 3, 4, 5],
    },
    {
      isbn: '978-604-1-00003-3',
      title: 'Nhà Giả Kim',
      description: 'Hành trình tìm kiếm kho báu và ý nghĩa cuộc sống. Một câu chuyện truyền cảm hứng về việc theo đuổi ước mơ và khám phá bản thân.',
      price: 79000,
      stock: 200,
      status: 'ACTIVE' as const,
      categorySlug: 'van-hoc',
      authorName: 'Paulo Coelho',
      publisherName: 'Nhà Xuất Bản Hội Nhà Văn',
      thumbnailMediaIndex: 2,
      galleryMediaIndices: [0, 3, 4], // Sử dụng media 0 cho gallery vì thumbnail dùng media 2
    },
    {
      isbn: '978-604-1-00004-4',
      title: 'Tôi Tài Giỏi, Bạn Cũng Thế!',
      description: 'Phương pháp học tập hiệu quả và phát triển bản thân. Cuốn sách giúp bạn khám phá tiềm năng thực sự của bản thân.',
      price: 149000,
      stock: 120,
      status: 'ACTIVE' as const,
      categorySlug: 'tu-phat-trien',
      authorName: 'Adam Khoo',
      publisherName: 'First News - Trí Việt',
      thumbnailMediaIndex: 3,
      galleryMediaIndices: [0, 1, 4, 5],
    },
    {
      isbn: '978-604-1-00005-5',
      title: 'Atomic Habits',
      description: 'Tạo thói quen tốt và bỏ thói quen xấu từng ngày. Một cuốn sách thực tế về cách xây dựng thói quen tốt và loại bỏ những thói quen xấu.',
      price: 169000,
      stock: 90,
      status: 'ACTIVE' as const,
      categorySlug: 'tu-phat-trien',
      authorName: 'James Clear',
      publisherName: 'Alpha Books',
      thumbnailMediaIndex: 4,
      galleryMediaIndices: [0, 1, 2, 5],
    },
    {
      isbn: '978-604-1-00006-6',
      title: 'Tư Duy Nhanh và Chậm',
      description: 'Khám phá cách bộ não suy nghĩ và ra quyết định. Cuốn sách đoạt giải Nobel về tâm lý học nhận thức.',
      price: 219000,
      stock: 70,
      status: 'ACTIVE' as const,
      categorySlug: 'khoa-hoc',
      authorName: 'Daniel Kahneman',
      publisherName: 'Thái Hà Books',
      thumbnailMediaIndex: 5,
      galleryMediaIndices: [0, 1, 2, 3],
    },
    {
      isbn: '978-604-1-00007-7',
      title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
      description: 'Câu chuyện về tuổi thơ ở một làng quê Việt Nam, với những kỷ niệm đẹp và trong trẻo.',
      price: 99000,
      stock: 180,
      status: 'ACTIVE' as const,
      categorySlug: 'thieu-nhi',
      authorName: 'Nguyễn Nhật Ánh',
      publisherName: 'Nhà Xuất Bản Trẻ',
      thumbnailMediaIndex: 6,
      galleryMediaIndices: [0, 1, 2],
    },
    {
      isbn: '978-604-1-00008-8',
      title: 'Outliers: Những Kẻ Xuất Chúng',
      description: 'Khám phá bí mật đằng sau những người thành công xuất chúng. Tại sao một số người đạt được thành công phi thường?',
      price: 179000,
      stock: 100,
      status: 'ACTIVE' as const,
      categorySlug: 'khoa-hoc',
      authorName: 'Malcolm Gladwell',
      publisherName: 'Alpha Books',
      thumbnailMediaIndex: 7,
      galleryMediaIndices: [0, 2, 3, 4],
    },
    {
      isbn: '978-604-1-00009-9',
      title: 'Rich Dad Poor Dad',
      description: 'Cuốn sách về giáo dục tài chính và tư duy đầu tư. Dạy bạn cách suy nghĩ về tiền bạc khác biệt.',
      price: 129000,
      stock: 0,
      status: 'OUT_OF_STOCK' as const,
      categorySlug: 'kinh-doanh',
      authorName: 'Robert Kiyosaki',
      publisherName: 'First News - Trí Việt',
      thumbnailMediaIndex: 8,
      galleryMediaIndices: [1, 3, 5],
    },
    {
      isbn: '978-604-1-00010-0',
      title: 'The Lean Startup',
      description: 'Phương pháp khởi nghiệp tinh gọn. Giúp bạn xây dựng startup thành công với chi phí tối thiểu.',
      price: 189000,
      stock: 60,
      status: 'ACTIVE' as const,
      categorySlug: 'kinh-doanh',
      authorName: 'Eric Ries',
      publisherName: 'Alpha Books',
      thumbnailMediaIndex: 9,
      galleryMediaIndices: [2, 4, 6],
    },
    {
      isbn: '978-604-1-00011-1',
      title: 'Thinking, Fast and Slow',
      description: 'Phiên bản tiếng Anh của cuốn "Tư Duy Nhanh và Chậm". Một khám phá về cách bộ não hoạt động.',
      price: 239000,
      stock: 50,
      status: 'ACTIVE' as const,
      categorySlug: 'sach-hoc-ngoai-ngu',
      authorName: 'Daniel Kahneman',
      publisherName: 'Thái Hà Books',
      thumbnailMediaIndex: 10,
      galleryMediaIndices: [3, 5, 7],
    },
    {
      isbn: '978-604-1-00012-2',
      title: 'Đắc Nhân Tâm - Bản Đặc Biệt',
      description: 'Phiên bản đặc biệt với minh họa đẹp mắt. Cuốn sách giao tiếp bán chạy nhất mọi thời đại.',
      price: 119000,
      stock: 200,
      status: 'ACTIVE' as const,
      categorySlug: 'tu-phat-trien',
      authorName: 'Dale Carnegie',
      publisherName: 'Alpha Books',
      thumbnailMediaIndex: 11,
      galleryMediaIndices: [4, 6, 8, 9],
    },
  ]

  // Xóa tất cả thumbnailId và gallery trước khi seed để tránh unique constraint conflict
  console.log('🧹 Đang xóa thumbnail và gallery cũ...')
  await prisma.bookGallery.deleteMany({})
  await prisma.book.updateMany({
    data: { thumbnailId: null },
  })

  // Tạo books với thumbnail và gallery
  const books = []
  for (const config of bookConfigs) {
    const thumbnailMedia = mediaRecords[config.thumbnailMediaIndex]
    const category = categories.find(c => c.slug === config.categorySlug)
    const author = authors.find(a => a.name === config.authorName)
    const publisher = publishers.find(p => p.name === config.publisherName)

    // Tạo book với thumbnail
    const book = await prisma.book.upsert({
      where: { isbn: config.isbn },
      update: {
        title: config.title,
        description: config.description,
        price: config.price,
        stock: config.stock,
        status: config.status,
        thumbnailId: thumbnailMedia.id,
        categoryId: category?.id,
        authorId: author?.id,
        publisherId: publisher?.id,
      },
      create: {
        title: config.title,
        description: config.description,
        isbn: config.isbn,
        price: config.price,
        stock: config.stock,
        status: config.status,
        thumbnailId: thumbnailMedia.id,
        categoryId: category?.id,
        authorId: author?.id,
        publisherId: publisher?.id,
      },
    })

    // Xóa gallery cũ (nếu có) và tạo gallery mới
    await prisma.bookGallery.deleteMany({
      where: { bookId: book.id },
    })

    if (config.galleryMediaIndices.length > 0) {
      await prisma.bookGallery.createMany({
        data: config.galleryMediaIndices.map((mediaIndex, order) => ({
          bookId: book.id,
          mediaId: mediaRecords[mediaIndex].id,
          order: order,
        })),
      })
    }

    books.push(book)
  }

  console.log(`✅ Đã tạo ${books.length} cuốn sách với thumbnail và gallery`)

  console.log('🎉 Seed dữ liệu hoàn tất!')
  console.log(`📊 Tổng kết:`)
  console.log(`   - ${categories.length} danh mục`)
  console.log(`   - ${authors.length} tác giả`)
  console.log(`   - ${publishers.length} nhà xuất bản`)
  console.log(`   - ${mediaRecords.length} media records`)
  console.log(`   - ${books.length} cuốn sách (với thumbnail và gallery)`)
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

