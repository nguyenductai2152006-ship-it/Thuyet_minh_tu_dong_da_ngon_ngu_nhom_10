-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: audio_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `audio_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `audio_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `audio_db`;

--
-- Table structure for table `audio`
--

DROP TABLE IF EXISTS `audio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audio` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `audio_url` varchar(500) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `duration_seconds` int NOT NULL,
  `language_code` varchar(10) NOT NULL,
  `poi_id` bigint NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_audio_poi_language` (`poi_id`,`language_code`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audio`
--

LOCK TABLES `audio` WRITE;
/*!40000 ALTER TABLE `audio` DISABLE KEYS */;
INSERT INTO `audio` VALUES (1,'/audio/3-vi.mp3','2026-10-13 09:36:02.732498',45,'vi',3,'2026-10-13 10:16:08.194048'),(2,'/audio/3-en.mp3','2026-10-13 09:36:02.732498',50,'en',3,'2026-10-13 10:16:08.194048'),(3,'/audio/3-zh.mp3','2026-10-13 09:36:02.732498',44,'zh',3,'2026-10-13 10:16:08.194048'),(4,'/audio/3-ko.mp3','2026-10-13 09:36:02.732498',49,'ko',3,'2026-10-13 10:16:08.194048'),(5,'/audio/3-ja.mp3','2026-10-13 09:36:02.732498',57,'ja',3,'2026-10-13 10:16:08.194048'),(6,'/audio/4-en.mp3','2026-10-13 10:16:08.194048',53,'en',4,'2026-10-13 10:16:08.194048'),(7,'/audio/4-ja.mp3','2026-10-13 10:16:08.194048',65,'ja',4,'2026-10-13 10:16:08.194048'),(8,'/audio/4-ko.mp3','2026-10-13 10:16:08.194048',55,'ko',4,'2026-10-13 10:16:08.194048'),(9,'/audio/4-vi.mp3','2026-10-13 10:16:08.194048',50,'vi',4,'2026-10-13 10:16:08.194048'),(10,'/audio/4-zh.mp3','2026-10-13 10:16:08.194048',48,'zh',4,'2026-10-13 10:16:08.194048'),(11,'/audio/5-en.mp3','2026-10-13 10:16:08.194048',49,'en',5,'2026-10-13 10:16:08.194048'),(12,'/audio/5-ja.mp3','2026-10-13 10:16:08.194048',60,'ja',5,'2026-10-13 10:16:08.194048'),(13,'/audio/5-ko.mp3','2026-10-13 10:16:08.194048',52,'ko',5,'2026-10-13 10:16:08.194048'),(14,'/audio/5-vi.mp3','2026-10-13 10:16:08.194048',49,'vi',5,'2026-10-13 10:16:08.194048'),(15,'/audio/5-zh.mp3','2026-10-13 10:16:08.194048',48,'zh',5,'2026-10-13 10:16:08.194048'),(16,'/audio/6-en.mp3','2026-10-13 10:16:08.194048',51,'en',6,'2026-10-13 10:16:08.194048'),(17,'/audio/6-ja.mp3','2026-10-13 10:16:08.194048',64,'ja',6,'2026-10-13 10:16:08.194048'),(18,'/audio/6-ko.mp3','2026-10-13 10:16:08.194048',56,'ko',6,'2026-10-13 10:16:08.194048'),(19,'/audio/6-vi.mp3','2026-10-13 10:16:08.194048',51,'vi',6,'2026-10-13 10:16:08.194048'),(20,'/audio/6-zh.mp3','2026-10-13 10:16:08.194048',50,'zh',6,'2026-10-13 10:16:08.194048'),(21,'/audio/7-en.mp3','2026-10-13 10:16:08.194048',56,'en',7,'2026-10-13 10:16:08.194048'),(22,'/audio/7-ja.mp3','2026-10-13 10:16:08.194048',63,'ja',7,'2026-10-13 10:16:08.194048'),(23,'/audio/7-ko.mp3','2026-10-13 10:16:08.194048',53,'ko',7,'2026-10-13 10:16:08.194048'),(24,'/audio/7-vi.mp3','2026-10-13 10:16:08.194048',50,'vi',7,'2026-10-13 10:16:08.194048'),(25,'/audio/7-zh.mp3','2026-10-13 10:16:08.194048',46,'zh',7,'2026-10-13 10:16:08.194048'),(26,'/audio/8-en.mp3','2026-10-13 10:16:08.194048',49,'en',8,'2026-10-13 10:16:08.194048'),(27,'/audio/8-ja.mp3','2026-10-13 10:16:08.194048',61,'ja',8,'2026-10-13 10:16:08.194048'),(28,'/audio/8-ko.mp3','2026-10-13 10:16:08.194048',52,'ko',8,'2026-10-13 10:16:08.194048'),(29,'/audio/8-vi.mp3','2026-10-13 10:16:08.194048',48,'vi',8,'2026-10-13 10:16:08.194048'),(30,'/audio/8-zh.mp3','2026-10-13 10:16:08.194048',51,'zh',8,'2026-10-13 10:16:08.194048'),(31,'/audio/9-en.mp3','2026-10-13 10:16:08.194048',48,'en',9,'2026-10-13 10:16:08.194048'),(32,'/audio/9-ja.mp3','2026-10-13 10:16:08.194048',56,'ja',9,'2026-10-13 10:16:08.194048'),(33,'/audio/9-ko.mp3','2026-10-13 10:16:08.194048',49,'ko',9,'2026-10-13 10:16:08.194048'),(34,'/audio/9-vi.mp3','2026-10-13 10:16:08.194048',46,'vi',9,'2026-10-13 10:16:08.194048'),(35,'/audio/9-zh.mp3','2026-10-13 10:16:08.194048',44,'zh',9,'2026-10-13 10:16:08.194048');
/*!40000 ALTER TABLE `audio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'audio_db'
--

--
-- Dumping routines for database 'audio_db'
--

--
-- Current Database: `identity_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `identity_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `identity_db`;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'identity_db'
--

--
-- Dumping routines for database 'identity_db'
--

--
-- Current Database: `localization_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `localization_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `localization_db`;

--
-- Table structure for table `poi_localizations`
--

DROP TABLE IF EXISTS `poi_localizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `poi_localizations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `language_code` varchar(10) NOT NULL,
  `localized_description` text NOT NULL,
  `localized_name` varchar(200) NOT NULL,
  `poi_id` bigint NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_poi_language` (`poi_id`,`language_code`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `poi_localizations`
--

LOCK TABLES `poi_localizations` WRITE;
/*!40000 ALTER TABLE `poi_localizations` DISABLE KEYS */;
INSERT INTO `poi_localizations` VALUES (1,'2026-10-05 12:35:57.188682','vi','Chào mừng quý khách đến với Chùa Cầu, hay còn gọi là Lai Viễn Kiều, biểu tượng vô giá và là linh hồn của di sản văn hóa thế giới Hội An. Được các thương nhân người Nhật Bản góp tiền xây dựng vào khoảng thế kỷ 17, công trình này mang đậm dấu ấn kiến trúc giao thoa giữa Việt Nam, Nhật Bản và Trung Hoa. Chùa có chiều dài khoảng 18 mét, vắt cong qua một lạch nước nhỏ nối liền hai bờ phố cổ. Điểm đặc biệt là dù gọi là chùa nhưng bên trong không thờ Phật mà thờ Bắc Đế Trấn Vũ – vị thần bảo hộ xứ sở, ban niềm vui và hạnh phúc cho con người. Hình ảnh Chùa Cầu vinh dự được in trên tờ tiền 20.000 VNĐ của Việt Nam. Xin mời quý khách bước vào trong, ngắm nhìn những chi tiết chạm khắc tinh xảo và cảm nhận nét tĩnh lặng, rêu phong qua hàng trăm năm lịch sử.','Chùa Cầu',3,'2026-10-05 13:57:59.640504'),(2,'2026-10-05 13:42:36.808862','en','Welcome to the Japanese Covered Bridge, also known as Lai Vien Kieu, the priceless symbol and soul of Hoi An World Cultural Heritage. Built by Japanese merchants in the 17th century, this structure features a unique architectural blend of Vietnam, Japan, and China. The bridge is about 18 meters long, curving across a small creek connecting the two banks of the ancient town. A special feature is that despite being called a pagoda, it does not worship Buddha but Bac De Tran Vu - the guardian deity of the land, bringing joy and happiness to people. The image of the Japanese Covered Bridge is honored to be printed on Vietnam\'s 20,000 VND banknote. Please step inside, admire the intricate carvings, and feel the tranquility and mossy beauty through hundreds of years of history.','Japanese Covered Bridge',3,'2026-10-05 13:57:59.640504'),(3,'2026-10-05 13:57:59.640504','zh','欢迎来到日本廊桥，又称来远桥，这是会安世界文化遗产的无价象征和灵魂。这座建筑由日本商人在17世纪左右集资建造，融合了越南、日本和中国的建筑风格。桥长约18米，横跨一条连接古镇两岸的小溪。特别之处在于，虽然被称为寺庙，但里面供奉的不是佛，而是北帝真武——这片土地的保护神，给人们带来欢乐和幸福。日本廊桥的形象荣幸地印在越南的20,000越南盾纸币上。请走进去，欣赏精美的雕刻，感受数百年来历史的宁静和沧桑。','日本桥',3,'2026-10-05 13:57:59.640504'),(4,'2026-10-05 13:57:59.640504','ko','호이안 세계 문화 유산의 귀중한 상징이자 영혼인 내원교(일본교)에 오신 것을 환영합니다. 17세기경 일본 상인들이 자금을 모아 건설한 이 건축물은 베트남, 일본, 중국의 건축 양식이 독특하게 혼합되어 있습니다. 다리의 길이는 약 18미터이며, 고도시의 양쪽 은행을 연결하는 작은 개울을 가로지르고 있습니다. 특별한 점은 사원이라고 불리지만 부처를 모시는 것이 아니라 사람들에게 기쁨과 행복을 가져다주는 수호신인 북제진무를 모신다는 것입니다. 일본교의 이미지는 베트남 20,000동 지폐에 인쇄되어 있습니다. 안으로 들어가 정교한 조각을 감상하고 수백 년 역사 속의 평온함과 고풍스러움을 느껴보세요.','일본교',3,'2026-10-05 13:57:59.640504'),(5,'2026-10-05 13:57:59.640504','ja','ホイアン世界文化遺産の貴重なシンボルであり魂でもある日本橋（来遠橋）へようこそ。17世紀頃に日本の商人たちによって建てられたこの建造物は、ベトナム、日本、中国の建築様式が融合した独特の特徴を持っています。橋の長さは約18メートルで、旧市街の両岸を結ぶ小さな川に架かっています。特別なのは、寺院と呼ばれていながら仏陀ではなく、人々に喜びと幸福をもたらす守護神である北帝真武を祀っていることです。日本橋の姿は、ベトナムの20,000ドン紙幣に印刷されていることでも知られています。中に足を踏み入れ、複雑な彫刻を鑑賞し、何百年もの歴史を経た静寂と苔むした美しさを感じてください。','日本橋',3,'2026-10-05 13:57:59.640504'),(6,'2026-10-05 13:57:59.640504','vi','Xin chào quý khách. Trước mắt quý khách là Nhà cổ Tấn Ký, ngôi nhà cổ đầu tiên tại Hội An được vinh danh là Di sản Quốc gia. Được xây dựng từ cuối thế kỷ 18, trải qua hơn 200 năm với nhiều thế hệ sinh sống, ngôi nhà vẫn giữ được gần như nguyên vẹn nét kiến trúc đặc trưng của đô thị cổ. Kiến trúc nhà Tấn Ký là sự kết hợp tuyệt mỹ giữa ba nền văn hóa: Nhật Bản, Trung Hoa và Việt Nam. Điểm nổi bật nhất là trần nhà bằng gỗ chạm trổ tinh xảo, hệ thống cột kèo vững chãi và thiết kế hình ống đặc trưng với giếng trời ở giữa giúp thông gió và đón ánh sáng tự nhiên. Nơi đây từng là cửa hiệu buôn bán sầm uất của tầng lớp thương gia giàu có. Quý khách hãy chú ý những bức hoành phi, câu đối và các cổ vật quý giá đang được trưng bày, mỗi hiện vật đều kể một câu chuyện sinh động về một thời vàng son của thương cảng Hội An.','Nhà cổ Tấn Ký',4,'2026-10-05 13:57:59.640504'),(7,'2026-10-05 13:57:59.640504','en','Welcome. Before you is Tan Ky Old House, the first ancient house in Hoi An to be honored as a National Heritage. Built in the late 18th century and having survived over 200 years with many generations living here, the house still keeps almost intact the typical architectural features of the ancient town. The architecture of Tan Ky house is a perfect combination of three cultures: Japan, China, and Vietnam. The most prominent feature is the exquisitely carved wooden ceiling, sturdy pillar system, and characteristic tubular design with a skylight in the middle to help ventilate and welcome natural light. This place used to be a bustling shop of the wealthy merchant class. Please pay attention to the horizontal lacquered boards, parallel sentences, and precious antiques on display, each telling a vivid story of the golden age of Hoi An trading port.','Tan Ky Ancient House',4,'2026-10-05 13:57:59.640504'),(8,'2026-10-05 13:57:59.640504','zh','欢迎您。在您面前的是进记古宅，这是会安第一座被评为国家遗产的古建筑。它建于18世纪末，经历了200多年的历史，多代人在这里生活，这座房子仍然几乎完好地保留了古镇典型的建筑特色。进记古宅的建筑是日本、中国和越南三种文化的完美结合。最突出的特点是精雕细琢的木制天花板、坚固的柱子系统以及中间带有天窗的管状设计，有助于通风和采光。这里曾经是富商阶层繁华的商店。请注意展出的横匾、对联和珍贵的古董，每一件文物都讲述了会安商港黄金时代的生动故事。','陈氏古宅',4,'2026-10-05 13:57:59.640504'),(9,'2026-10-05 13:57:59.640504','ko','환영합니다. 여러분 앞에 있는 떤끼 고가는 호이안에서 처음으로 국가 유산으로 지정된 고가입니다. 18세기 말에 지어져 여러 세대가 거주하며 200년 넘게 살아남은 이 집은 고도시의 전형적인 건축적 특징을 거의 온전히 간직하고 있습니다. 떤끼 고가의 건축물은 일본, 중국, 베트남 세 문화의 완벽한 조화입니다. 가장 두드러진 특징은 정교하게 조각된 나무 천장, 튼튼한 기둥 시스템, 그리고 중앙에 천창이 있어 통풍과 자연 채광을 돕는 특징적인 튜브형 디자인입니다. 이곳은 과거 부유한 상인 계층의 번화한 상점이었습니다. 전시된 편액, 대련, 귀중한 골동품에 주목해 보세요. 각 유물은 호이안 무역항의 황금기에 대한 생생한 이야기를 들려줍니다.','떤끼 고가',4,'2026-10-05 13:57:59.640504'),(10,'2026-10-05 13:57:59.640504','ja','ようこそ。目の前にあるのは、ホイアンで最初に国家遺産として認定されたタンキの古い家です。18世紀後半に建てられ、何世代にもわたって200年以上も生き残ってきたこの家は、旧市街の典型的な建築的特徴をほぼ完全に残しています。タンキの家の建築は、日本、中国、ベトナムの3つの文化の完璧な組み合わせです。最も顕著な特徴は、精巧に彫られた木製の天井、頑丈な柱のシステム、そして換気と自然光を取り入れるための中央に天窓がある特徴的なチューブ状のデザインです。この場所はかつて、裕福な商人階級の賑やかな店でした。展示されている横額、対聯、貴重な骨董品に注目してください。それぞれの遺物がホイアン貿易港の黄金時代の鮮やかな物語を語っています。','タンキー古民家',4,'2026-10-05 13:57:59.640504'),(11,'2026-10-05 13:57:59.640504','vi','Chào mừng quý khách đến với Hội quán Phúc Kiến, một trong những hội quán có quy mô lớn nhất và kiến trúc lộng lẫy nhất tại phố cổ Hội An. Được xây dựng vào năm 1697 bởi những thương nhân người Hoa quê ở Phúc Kiến, công trình này ban đầu là một gian miếu nhỏ thờ pho tượng Thiên Hậu Thánh Mẫu vớt được từ biển khơi. Qua nhiều lần trùng tu, hội quán ngày nay mang đậm vẻ đẹp khang trang với cổng tam quan đồ sộ, mái ngói uốn cong chạm trổ hình rồng phượng uy nghi. Bên trong, không gian thờ cúng vô cùng trang nghiêm, nổi bật với những vòng nhang lớn treo trên trần nhà có thể cháy trong nhiều tháng. Không chỉ là nơi sinh hoạt tâm linh, cầu mong mưa thuận gió hòa, quốc thái dân an, Hội quán Phúc Kiến còn là nơi gắn kết cộng đồng người Hoa. Xin mời quý khách cùng chiêm ngưỡng những tác phẩm điêu khắc gỗ tinh xảo và tận hưởng không gian thanh tịnh nơi đây.','Hội quán Phúc Kiến',5,'2026-10-13 17:17:28.000000'),(12,'2026-10-05 13:57:59.640504','en','Welcome to Phuc Kien Assembly Hall, one of the largest and most magnificent assembly halls in Hoi An ancient town. Built in 1697 by Chinese merchants from Fujian, this structure was originally a small shrine worshipping the statue of Thien Hau Holy Mother salvaged from the sea. Through many restorations, the assembly hall today has a grand appearance with a massive three-entrance gate and a curved tile roof carved with majestic dragons and phoenixes. Inside, the worship space is highly solemn, highlighted by large incense coils hanging on the ceiling that can burn for many months. Not only a spiritual place to pray for good weather and peace, Phuc Kien Assembly Hall is also a place to bond the Chinese community. Please admire the exquisite wooden sculptures and enjoy the tranquil space here.','Fujian Assembly Hall',5,'2026-10-05 13:57:59.640504'),(13,'2026-10-05 13:57:59.640504','zh','欢迎来到福建会馆，这是会安古镇规模最大、最宏伟的会馆之一。这座建筑由来自福建的中国商人于1697年建造，最初是一个供奉从海里打捞上来的天后圣母神像的小神庙。经过多次修缮，今天的会馆显得非常宏伟，拥有巨大的三门和雕刻着威武龙凤的弯曲瓦屋顶。在内部，祭祀空间非常庄严，最引人注目的是悬挂在天花板上的大型盘香，可以燃烧数月。福建会馆不仅是祈求风调雨顺、国泰民安的精神场所，也是凝聚华人社区的地方。请欣赏精美的木雕作品，享受这里的宁静空间。','福建会馆',5,'2026-10-05 13:57:59.640504'),(14,'2026-10-05 13:57:59.640504','ko','호이안 고도시에서 가장 크고 웅장한 회관 중 하나인 복건회관에 오신 것을 환영합니다. 1697년 푸젠성 출신의 중국 상인들에 의해 지어진 이 건축물은 원래 바다에서 인양된 천후성모 동상을 모시는 작은 사당이었습니다. 여러 차례의 복원을 거쳐 오늘날의 회관은 거대한 삼관문과 위엄 있는 용과 봉황이 조각된 곡선형 기와 지붕으로 웅장한 모습을 갖추고 있습니다. 내부의 예배 공간은 매우 엄숙하며, 천장에 매달려 몇 달 동안 탈 수 있는 대형 나선형 향이 돋보입니다. 좋은 날씨와 평화를 기원하는 영적인 장소일 뿐만 아니라 복건회관은 중국인 커뮤니티를 결속시키는 곳이기도 합니다. 절묘한 목공예품을 감상하고 이곳의 평온한 공간을 즐겨보세요.','푸젠 회관',5,'2026-10-05 13:57:59.640504'),(15,'2026-10-05 13:57:59.640504','ja','ホイアン旧市街で最大かつ最も壮大な会館の一つである福建会館へようこそ。1697年に福建省出身の中国人商人によって建てられたこの建造物は、もともと海から引き上げられた天后聖母の像を祀る小さな祠でした。何度もの修復を経て、今日の会館は巨大な三門と、威厳のある龍と鳳凰が彫られた曲線的な瓦屋根を持つ壮大な外観となっています。内部の礼拝スペースは非常に厳粛で、天井に吊るされた何ヶ月も燃え続けることができる大きな渦巻き線香が特徴です。天候と平和を祈る精神的な場所であるだけでなく、福建会館は中国人コミュニティの絆を深める場所でもあります。絶妙な木彫りを鑑賞し、ここの静かな空間を楽しんでください。','福建会館',5,'2026-10-05 13:57:59.640504'),(16,'2026-10-05 13:57:59.640504','vi','Xin chào mừng quý khách đến với Chợ Hội An – trái tim nhịp đập sôi động nhất của khu phố cổ. Khác với vẻ tĩnh lặng của những ngôi nhà cổ hay hội quán, Chợ Hội An mang đến một không gian tràn đầy sức sống, màu sắc và hương vị đặc trưng của vùng đất Quảng Nam. Nằm sát bờ sông Thu Bồn, từ xưa nơi đây đã là điểm giao thương sầm uất, nơi các thuyền buôn tấp nập vào ra. Ngày nay, bước vào chợ, quý khách sẽ bị choáng ngợp bởi khu ẩm thực phong phú với vô vàn món ngon nức tiếng như cao lầu, mì Quảng, bánh hoa hồng trắng hay chè bắp. Không chỉ có ẩm thực, chợ còn bày bán đa dạng các loại đặc sản địa phương, hải sản tươi sống, rau củ và hàng thủ công mỹ nghệ. Quý khách hãy thử dạo quanh một vòng, thưởng thức một ly chè ngọt mát, trò chuyện cùng những cô chú tiểu thương thân thiện để cảm nhận trọn vẹn nét văn hóa sinh hoạt mộc mạc, chân chất của người dân phố Hội.','Chợ Hội An',6,'2026-10-05 13:57:59.640504'),(17,'2026-10-05 13:57:59.640504','en','Welcome to Hoi An Market – the most vibrant beating heart of the ancient town. Unlike the tranquility of ancient houses or assembly halls, Hoi An Market brings a space full of vitality, colors, and typical flavors of Quang Nam land. Located close to the Thu Bon Riverbank, this place has long been a bustling trading point where merchant ships frequented. Today, stepping into the market, you will be overwhelmed by the rich food court with countless famous delicacies such as Cao Lau, Quang noodles, white rose dumplings, or corn sweet soup. Not only food, the market also offers a wide variety of local specialties, fresh seafood, vegetables, and handicrafts. Try taking a stroll around, enjoying a cool glass of sweet soup, and chatting with the friendly merchants to fully feel the rustic, honest lifestyle of Hoi An people.','Hoi An Market',6,'2026-10-05 13:57:59.640504'),(18,'2026-10-05 13:57:59.640504','zh','欢迎来到会安市场——古镇最充满活力的跳动的心脏。与古宅或会馆的宁静不同，会安市场带来了一个充满生机、色彩和广南土地典型风味的空间。这里靠近秋盆河畔，自古以来就是一个繁华的交易点，商船络绎不绝。今天，走进市场，你会被丰富的美食广场和无数著名的美味佳肴所震撼，如高楼面、广南面、白玫瑰或玉米糖水。不仅是食物，市场还提供各种当地特产、新鲜海鲜、蔬菜和手工艺品。试着逛一逛，享用一杯清凉的糖水，与友好的商贩聊天，充分感受会安人民质朴、诚实的生活方式。','会安市场',6,'2026-10-05 13:57:59.640504'),(19,'2026-10-05 13:57:59.640504','ko','고도시의 가장 활기차게 뛰는 심장, 호이안 시장에 오신 것을 환영합니다. 고가나 회관의 고요함과 달리, 호이안 시장은 꽝남 땅의 생명력, 색채, 전형적인 풍미가 가득한 공간을 선사합니다. 투본 강변에 가까이 위치한 이곳은 예로부터 상선들이 빈번하게 드나드는 번화한 무역의 중심지였습니다. 오늘날 시장에 들어서면 까오러우, 꽝 국수, 화이트 로즈 만두, 옥수수 달콤한 수프 등 수많은 유명한 진미가 있는 풍부한 푸드 코트에 압도될 것입니다. 음식뿐만 아니라 시장에서는 다양한 지역 특산품, 신선한 해산물, 채소, 수공예품도 판매합니다. 호이안 사람들의 소박하고 정직한 생활 방식을 온전히 느끼기 위해 한 바퀴 돌아보고 시원한 수프 한 잔을 즐기며 친근한 상인들과 이야기를 나누어 보세요.','호이안 시장',6,'2026-10-05 13:57:59.640504'),(20,'2026-10-05 13:57:59.640504','ja','ホイアン市場へようこそ – 旧市街の最も活気に満ちた鼓動の心臓部です。古い家屋や会館の静けさとは異なり、ホイアン市場は活気、色彩、そしてクアンナムの地の典型的な風味に満ちた空間をもたらします。トゥボン川の岸辺に近く、この場所は昔から商船が頻繁に出入りする賑やかな交易の拠点でした。今日、市場に足を踏み入れると、カオラウ、クアン麺、ホワイトローズ、トウモロコシのチェーなど、数え切れないほどの有名な珍味がある豊富なフードコートに圧倒されるでしょう。食べ物だけでなく、市場では地元の特産品、新鮮なシーフード、野菜、手工芸品も多種多様に販売されています。ホイアンの人々の素朴で誠実なライフスタイルを十分に感じるために、少し散歩して、冷たいチェーを楽しみ、フレンドリーな商人とおしゃべりしてみてください。','ホイアン市場',6,'2026-10-05 13:57:59.640504'),(21,'2026-10-05 13:57:59.640504','vi','Chào mừng quý khách dừng chân tại Hội quán Quảng Đông. Được xây dựng vào năm 1885 bởi bang hội thương nhân Quảng Đông, Trung Quốc, hội quán này là một minh chứng rực rỡ cho sự phồn thịnh của thương cảng Hội An xưa. Bước qua cổng tam quan bề thế, quý khách sẽ ấn tượng ngay với hòn non bộ điêu khắc hình rồng uốn lượn uy dũng ở sân trước. Kiến trúc hội quán là sự hòa quyện độc đáo giữa các chất liệu gỗ, đá và gốm sứ men màu, tạo nên một tổng thể vô cùng bắt mắt và tinh xảo. Chính điện của hội quán thờ Quan Công, vị tướng tượng trưng cho sự trung nghĩa, tín thành – những đức tính được giới thương nhân đề cao hàng đầu. Hàng năm, vào dịp rằm tháng Giêng hay ngày vía Quan Công, nơi đây lại diễn ra các lễ hội truyền thống thu hút đông đảo người dân và du khách. Xin mời quý khách bước vào trong để khám phá những hiện vật gốm sứ cổ.','Hội quán Quảng Đông',7,'2026-10-05 13:57:59.640504'),(22,'2026-10-05 13:57:59.640504','en','Welcome to the Cantonese Assembly Hall. Built in 1885 by the association of Cantonese merchants, China, this assembly hall is a brilliant testament to the prosperity of the ancient Hoi An trading port. Stepping through the massive three-entrance gate, you will be immediately impressed by the miniature mountain carved in the shape of a majestic winding dragon in the front courtyard. The architecture of the assembly hall is a unique blend of wood, stone, and colored glazed ceramics, creating an extremely eye-catching and sophisticated overall look. The main hall worships Guan Yu, a general representing loyalty and faithfulness – virtues highly valued by merchants. Every year, on the occasion of the Lantern Festival or the anniversary of Guan Yu, traditional festivals take place here, attracting a large number of locals and tourists. Please step inside to discover ancient ceramic artifacts.','Cantonese Assembly Hall',7,'2026-10-05 13:57:59.640504'),(23,'2026-10-05 13:57:59.640504','zh','欢迎来到广肇会馆。这座会馆由中国广东商会建于1885年，是古会安商港繁荣的辉煌见证。走过宏伟的三门，你会立刻被前院雕刻成威武蜿蜒巨龙形状的假山所吸引。会馆的建筑是木材、石头和彩色釉面陶瓷的独特融合，创造了一个非常引人注目和精致的整体外观。正殿供奉关羽，这位将军代表着忠诚和信义——这些美德受到商人的高度重视。每年，在元宵节或关羽的纪念日，这里都会举行传统节日，吸引大量当地人和游客。请走进去探索古老的陶瓷文物。','广东会馆',7,'2026-10-05 13:57:59.640504'),(24,'2026-10-05 13:57:59.640504','ko','광동 회관에 오신 것을 환영합니다. 1885년 중국 광동 상인 협회에 의해 세워진 이 회관은 고대 호이안 무역항의 번영을 보여주는 빛나는 증거입니다. 거대한 삼관문을 지나면 앞마당에 웅장하게 구불구불한 용 모양으로 조각된 미니어처 산(가산)에 즉시 깊은 인상을 받을 것입니다. 회관의 건축물은 나무, 돌, 유색 유약 도자기의 독특한 조화로 매우 눈길을 끌고 정교한 전체적인 모습을 만들어냅니다. 본당에서는 상인들이 높이 평가하는 미덕인 충성과 신의를 상징하는 장군 관우를 모십니다. 매년 정월 대보름이나 관우의 기념일에는 이곳에서 전통 축제가 열려 많은 현지인과 관광객을 끌어들입니다. 안으로 들어가 고대 도자기 유물을 발견해 보세요.','광동 회관',7,'2026-10-05 13:57:59.640504'),(25,'2026-10-05 13:57:59.640504','ja','廣東会館へようこそ。1885年に中国の広東商人協会によって建てられたこの会館は、古代ホイアン貿易港の繁栄を示す輝かしい証です。巨大な三門を抜けると、前庭にある威厳のある曲がりくねった龍の形に彫られた築山にすぐに感銘を受けるでしょう。会館の建築は、木材、石、そして色釉陶器のユニークな融合であり、非常に人目を引く洗練された全体的な外観を作り出しています。本堂には、商人たちが高く評価する美徳である忠誠と信義を象徴する将軍、関羽が祀られています。毎年、元宵節や関羽の記念日には、ここで伝統的なお祭りが開催され、多くの地元の人々や観光客が集まります。中に足を踏み入れて、古代の陶器の遺物を発見してください。','広東会館',7,'2026-10-05 13:57:59.640504'),(31,'2026-10-11 14:47:04.552351','vi','Xin chào quý khách. Quý khách đang đứng trước Nhà cổ Phùng Hưng, một trong những ngôi nhà cổ đẹp nhất và có kiến trúc độc đáo bậc nhất tại Hội An. Ra đời vào khoảng giữa thế kỷ 19, ngôi nhà này thuộc sở hữu của một thương gia giàu có, người đã đặt tên \"Phùng Hưng\" với mong muốn công việc làm ăn luôn hưng thịnh, phát đạt. Điểm làm nên sự khác biệt của Nhà cổ Phùng Hưng chính là phần mái vòm cao rộng, mang đậm phong cách kiến trúc Nhật Bản, kết hợp hài hòa với hệ thống sườn gỗ, cột chống theo kiểu Trung Hoa và ban công mang hơi hướng Việt Nam. Ngôi nhà có thiết kế hai tầng rộng rãi, tầng dưới từng là nơi bày bán các mặt hàng lâm thổ sản, gia vị và lụa tơ tằm, trong khi tầng trên dành cho sinh hoạt gia đình và thờ cúng. Đặc biệt, trên trần nhà có hệ thống cửa sập thông minh giúp vận chuyển hàng hóa lên cao mỗi khi có lũ lụt.','Nhà cổ Phùng Hưng',8,'2026-10-11 14:47:04.552351'),(32,'2026-10-11 14:47:04.552351','vi','Chào mừng quý khách đến tham quan Hội quán Triều Châu, một công trình kiến trúc tuyệt mỹ nằm khiêm nhường nhưng đầy sức hút giữa lòng Hội An. Được cộng đồng người Triều Châu xây dựng vào năm 1845, hội quán này là nơi thờ Phục Ba tướng quân Mã Viện, vị thần được người dân tin rằng luôn che chở, bảo vệ những chuyến thuyền buôn vượt sóng gió ngoài khơi xa. Điều làm nên giá trị nghệ thuật đặc sắc nhất của Hội quán Triều Châu chính là nghệ thuật đắp nổi hoa văn bằng sành sứ vô cùng tinh vi và điêu luyện. Dọc theo các bờ nóc, bờ quyết, quý khách có thể dễ dàng nhận ra những hình tượng rồng phượng, chim muông, hoa lá được tạo hình sống động từ những mảnh gốm sứ nhiều màu sắc. Hệ thống các khung gỗ, bình phong bên trong cũng được chạm trổ tỉ mỉ với những điển tích văn hóa Trung Hoa cổ đại.','Hội quán Triều Châu',9,'2026-10-11 14:47:04.552351'),(53,'2026-10-11 14:47:04.552351','en','Welcome. You are standing in front of Phung Hung Old House, one of the most beautiful ancient houses with the most unique architecture in Hoi An. Born in the mid-19th century, this house belonged to a wealthy merchant who named it \"Phung Hung\" with the desire for a prosperous and successful business. What sets Phung Hung Old House apart is the high and wide dome, imbued with Japanese architectural style, harmoniously combined with the wooden frame system, Chinese-style supporting columns, and a Vietnamese-inspired balcony. The house has a spacious two-story design; the lower floor used to be a place to sell forest products, spices, and silk, while the upper floor was reserved for family living and worship. Notably, the ceiling has a smart trapdoor system to help transport goods upwards during floods.','Phung Hung Old House',8,'2026-10-09 22:05:41.000000'),(54,'2026-10-11 14:47:04.552351','zh','欢迎。你正站在冯兴古宅前，这是会安最美丽、建筑最独特的古建筑之一。这座房子诞生于19世纪中叶，属于一位富商，他将其命名为“冯兴”，寓意生意兴隆、繁荣昌盛。冯兴古宅的与众不同之处在于其高大宽阔的穹顶，充满日本建筑风格，与木框架系统、中式支撑柱和越南风格的阳台和谐地结合在一起。这座房子有宽敞的两层设计；下层曾经是出售林产品、香料和丝绸的地方，而上层则保留用于家庭生活和祭祀。值得注意的是，天花板上有一个智能的活板门系统，有助于在洪水期间将货物运送到高处。','冯兴古宅',8,'2026-10-09 22:05:41.000000'),(55,'2026-10-11 14:47:04.552351','ko','환영합니다. 여러분은 호이안에서 가장 아름답고 가장 독특한 건축물을 가진 고가 중 하나인 풍흥 고가 앞에 서 있습니다. 19세기 중반에 지어진 이 집은 번창하고 성공적인 사업을 기원하며 \"풍흥\"이라는 이름을 지은 부유한 상인의 소유였습니다. 풍흥 고가를 돋보이게 하는 것은 일본 건축 양식이 스며든 높고 넓은 돔으로, 목조 프레임 시스템, 중국식 기둥, 베트남풍의 발코니와 조화롭게 결합되어 있습니다. 이 집은 넓은 2층 구조로 되어 있습니다. 아래층은 임산물, 향신료, 비단을 파는 곳이었고 위층은 가족의 생활과 예배를 위한 공간이었습니다. 특히 천장에는 홍수 때 물건을 위로 운반하는 데 도움이 되는 스마트한 다락문 시스템이 있습니다.','풍흥 고가',8,'2026-10-09 22:05:41.000000'),(56,'2026-10-11 14:47:04.552351','ja','ようこそ。あなたは、ホイアンで最も美しく最もユニークな建築を持つ古い家の一つである、フンフンの古い家の前に立っています。19世紀半ばに建てられたこの家は、繁栄と成功を願って「フンフン」と名付けた裕福な商人の所有物でした。フンフンの古い家を際立たせているのは、日本の建築様式が染み込んだ高く広いドームであり、木枠のシステム、中国風の支柱、そしてベトナム風のバルコニーと見事に調和しています。この家は広々とした2階建ての設計で、下の階はかつて林産物、香辛料、絹を売る場所でしたが、上の階は家族の生活と祭祀のために確保されていました。特に、天井には洪水時に商品を上に運ぶのに役立つスマートな跳ね上げ戸のシステムがあります。','フンフンの古い家',8,'2026-10-09 22:05:41.000000'),(57,'2026-10-11 14:47:04.552351','en','Welcome to visit Trieu Chau (Chaozhou) Assembly Hall, a magnificent architectural work lying humbly yet attractively in the heart of Hoi An. Built by the Chaozhou community in 1845, this assembly hall is a place to worship General Ma Yuan, a deity believed by locals to always protect and safeguard merchant ships weathering storms at sea. What makes the most distinctive artistic value of Trieu Chau Assembly Hall is the art of embossed patterns using ceramics that is extremely intricate and skillful. Along the roof ridges and corners, you can easily recognize lively images of dragons, phoenixes, birds, and flowers created from colorful ceramic pieces. The system of wooden frames and screens inside is also meticulously carved with ancient Chinese cultural anecdotes.','Trieu Chau Assembly Hall',9,'2026-10-09 22:05:41.000000'),(58,'2026-10-11 14:47:04.552351','zh','欢迎参观潮州会馆，这是一座坐落于会安市中心、谦逊却极具吸引力的宏伟建筑。这座会馆由潮州社区于1845年建造，是供奉伏波将军马援的地方，当地人相信这位神灵总是庇护和保卫在海上经历风浪的商船。潮州会馆最具特色的艺术价值在于极其复杂和巧妙的陶瓷浮雕艺术。沿着屋脊和角落，你可以很容易地认出由五颜六色的陶瓷碎片组成的生动的龙、凤、鸟和花的图像。内部的木制框架和屏风系统也精心雕刻着中国古代文化的典故。','潮州会馆',9,'2026-10-09 22:05:41.000000'),(59,'2026-10-11 14:47:04.552351','ko','호이안의 중심부에 겸손하면서도 매력적으로 자리 잡은 장엄한 건축물인 조주 회관에 오신 것을 환영합니다. 1845년 조주(차오저우) 커뮤니티에 의해 세워진 이 회관은 바다에서 폭풍을 견디는 상선들을 항상 보호하고 지켜준다고 현지인들이 믿는 신인 복파장군 마원을 모시는 곳입니다. 조주 회관의 가장 독특한 예술적 가치를 만드는 것은 매우 정교하고 솜씨 있는 도자기 부조(양각) 패턴 예술입니다. 지붕 용마루와 모서리를 따라 다채로운 도자기 조각으로 만든 용, 봉황, 새, 꽃의 생생한 이미지를 쉽게 알아볼 수 있습니다. 내부의 목조 프레임과 병풍 시스템도 고대 중국 문화의 일화로 꼼꼼하게 조각되어 있습니다.','조주 회관',9,'2026-10-09 22:05:41.000000'),(60,'2026-10-11 14:47:04.552351','ja','ホイアンの中心部に謙虚でありながらも魅力的に佇む壮大な建築物、潮州会館へようこそ。1845年に潮州コミュニティによって建てられたこの会館は、海で嵐を乗り越える商船を常に保護し守ってくれると地元の人々に信じられている神、伏波将軍の馬援を祀る場所です。潮州会館の最も際立った芸術的価値を生み出しているのは、非常に複雑で巧みな陶器の浮き彫り模様の芸術です。屋根の棟や角に沿って、色とりどりの陶器の破片から作られた龍、鳳凰、鳥、花の生き生きとした画像を簡単に認識できます。内部の木枠や屏風のシステムも、古代中国の文化的な逸話が細心の注意を払って彫刻されています。','潮州会館',9,'2026-10-09 22:05:41.000000');
/*!40000 ALTER TABLE `poi_localizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'localization_db'
--

--
-- Dumping routines for database 'localization_db'
--

--
-- Current Database: `poi_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `poi_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `poi_db`;

--
-- Table structure for table `analytics_events`
--

DROP TABLE IF EXISTS `analytics_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_type` varchar(32) NOT NULL,
  `visitor_id` char(36) DEFAULT NULL,
  `session_id` char(36) NOT NULL,
  `poi_id` bigint DEFAULT NULL,
  `page_path` varchar(255) NOT NULL,
  `source` varchar(32) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_event_time` (`event_type`,`created_at`),
  KEY `idx_visitor_time` (`visitor_id`,`created_at`),
  KEY `idx_session_time` (`session_id`,`created_at`),
  KEY `idx_poi_time` (`poi_id`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics_events`
--

LOCK TABLES `analytics_events` WRITE;
/*!40000 ALTER TABLE `analytics_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pois`
--

DROP TABLE IF EXISTS `pois`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pois` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `name` varchar(200) NOT NULL,
  `qr_code` varchar(100) DEFAULT NULL,
  `radius` decimal(8,2) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK1etj6f3w37in16dhh8wvvc4u4` (`qr_code`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pois`
--

LOCK TABLES `pois` WRITE;
/*!40000 ALTER TABLE `pois` DISABLE KEYS */;
INSERT INTO `pois` VALUES (3,'2026-10-03 15:54:07.000000','Công trình kiến trúc biểu tượng của Hội An.','/Images/Chua-cau-Hoi-An.jpg',15.8770873,108.3260704,'Chùa Cầu','HOIANGUIDE_POI_3',30.00,'ACTIVE','2026-10-09 14:34:22.000000'),(4,'2026-10-03 15:54:07.000000','Một trong những ngôi nhà cổ tiêu biểu trong khu phố cổ Hội An.','/Images/Nha-co-Tan-Ky.jpg',15.8764821,108.3277659,'Nhà cổ Tấn Ký','HOIANGUIDE_POI_4',20.00,'ACTIVE','2026-10-09 14:34:22.000000'),(5,'2026-10-03 15:54:07.000000','Công trình văn hóa của cộng đồng người Hoa tại Hội An.','/Images/Hoi-quan-Phuc-Kien.jpg',15.8774847,108.3306281,'Hội quán Phúc Kiến','HOIANGUIDE_POI_5',30.00,'ACTIVE','2026-10-09 14:34:22.000000'),(6,'2026-10-03 15:54:07.000000','Khu chợ trung tâm với nhiều sản vật và món ăn địa phương.','/Images/Cho-Hoi-An.jpg',15.8773179,108.3312662,'Chợ Hội An','HOIANGUIDE_POI_6',30.00,'ACTIVE','2026-10-09 14:34:22.000000'),(7,'2026-10-03 16:08:24.000000','Một công trình kiến trúc và văn hóa tiêu biểu trong khu phố cổ Hội An.','/Images/Hoi-quan-Quang-Dong.jpg',15.8771518,108.3265642,'Hội quán Quảng Đông','HOIANGUIDE_POI_7',30.00,'ACTIVE','2026-10-09 14:34:22.000000'),(8,'2026-10-09 14:34:22.000000','Một trong những ngôi nhà cổ đẹp nhất tại Hội An.','/Images/Nha-co-Phung-Hung.jpg',15.8771915,108.3258009,'Nhà cổ Phùng Hưng','HOIANGUIDE_POI_8',30.00,'ACTIVE','2026-10-10 07:26:19.000000'),(9,'2026-10-09 14:34:22.000000','Công trình kiến trúc tuyệt mỹ của người Triều Châu.','/Images/Hoi-quan-Trieu-Chau.jpg',15.8778422,108.3330722,'Hội quán Triều Châu','HOIANGUIDE_POI_9',30.00,'ACTIVE','2026-10-10 07:26:19.000000');
/*!40000 ALTER TABLE `pois` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pois_backup_20261013`
--

DROP TABLE IF EXISTS `pois_backup_20261013`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pois_backup_20261013` (
  `id` bigint NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `name` varchar(200) NOT NULL,
  `qr_code` varchar(100) DEFAULT NULL,
  `radius` decimal(8,2) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pois_backup_20261013`
--

LOCK TABLES `pois_backup_20261013` WRITE;
/*!40000 ALTER TABLE `pois_backup_20261013` DISABLE KEYS */;
INSERT INTO `pois_backup_20261013` VALUES (3,'2026-10-03 15:54:07.000000','Công trình kiến trúc biểu tượng của Hội An.','/Images/Chua-cau-Hoi-An.jpg',15.8770000,108.3260000,'Chùa Cầu','HOIANGUIDE_POI_3',30.00,'ACTIVE','2026-10-09 14:34:22.000000'),(4,'2026-10-03 15:54:07.000000','Một trong những ngôi nhà cổ tiêu biểu trong khu phố cổ Hội An.','/Images/Nha-co-Tan-Ky.jpg',15.8775000,108.3264000,'Nhà cổ Tấn Ký','HOIANGUIDE_POI_4',20.00,'ACTIVE','2026-10-09 14:34:22.000000'),(5,'2026-10-03 15:54:07.000000','Công trình văn hóa của cộng đồng người Hoa tại Hội An.','/Images/Hoi-quan-Phuc-Kien.jpg',15.8772000,108.3269000,'Hội quán Phúc Kiến','HOIANGUIDE_POI_5',30.00,'ACTIVE','2026-10-09 14:34:22.000000'),(6,'2026-10-03 15:54:07.000000','Khu chợ trung tâm với nhiều sản vật và món ăn địa phương.','/Images/Cho-Hoi-An.jpg',15.8759000,108.3276000,'Chợ Hội An','HOIANGUIDE_POI_6',30.00,'ACTIVE','2026-10-09 14:34:22.000000'),(7,'2026-10-03 16:08:24.000000','Một công trình kiến trúc và văn hóa tiêu biểu trong khu phố cổ Hội An.','/Images/Hoi-quan-Quang-Dong.jpg',15.8768000,108.3263000,'Hội quán Quảng Đông','HOIANGUIDE_POI_7',30.00,'ACTIVE','2026-10-09 14:34:22.000000'),(8,'2026-10-09 14:34:22.000000','Một trong những ngôi nhà cổ đẹp nhất tại Hội An.','/Images/Nha-co-Phung-Hung.jpg',15.8771000,108.3255000,'Nhà cổ Phùng Hưng','HOIANGUIDE_POI_8',30.00,'ACTIVE','2026-10-10 07:26:19.000000'),(9,'2026-10-09 14:34:22.000000','Công trình kiến trúc tuyệt mỹ của người Triều Châu.','/Images/Hoi-quan-Trieu-Chau.jpg',15.8779000,108.3280000,'Hội quán Triều Châu','HOIANGUIDE_POI_9',30.00,'ACTIVE','2026-10-10 07:26:19.000000');
/*!40000 ALTER TABLE `pois_backup_20261013` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'poi_db'
--

--
-- Dumping routines for database 'poi_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-24  4:51:03
